import type { Response } from 'express';
import { Post } from '../models/Post.ts';
import { User } from '../models/User.ts';
import { Page } from '../models/Page.ts';
import { SiteMetric } from '../models/SiteMetric.ts';
import type { AuthRequest } from '../middleware/auth.ts';

const SITE_PATH_METRIC_PREFIX = 'site-path:';

function isAdmin(role?: string) {
  return role === 'admin';
}

function formatCalendarDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function normalizeMonthQuery(rawMonth: unknown, rawYear: unknown) {
  const now = new Date();
  const parsedMonth = typeof rawMonth === 'string' ? Number.parseInt(rawMonth, 10) : Number.NaN;
  const parsedYear = typeof rawYear === 'string' ? Number.parseInt(rawYear, 10) : Number.NaN;
  const month = Number.isInteger(parsedMonth) && parsedMonth >= 0 && parsedMonth <= 11 ? parsedMonth : now.getMonth();
  const year = Number.isInteger(parsedYear) && parsedYear >= 2020 && parsedYear <= 2100 ? parsedYear : now.getFullYear();
  return { month, year };
}

function humanizePathLabel(pathname: string) {
  if (pathname === '/') return 'Inicio';
  return pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment).replace(/-/g, ' '))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' / ');
}

export const getAdminDashboard = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const { month, year } = normalizeMonthQuery(req.query.month, req.query.year);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 1);

    const [
      totalUsers,
      totalPosts,
      publishedPosts,
      draftPosts,
      totalPages,
      siteMetric,
      blogMetric,
      totalPostViewsResult,
      topPostsByViews,
      topPagesByViews,
      monthPosts,
      usersByPublicationCount,
      publicationsByTag,
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Post.countDocuments({ status: 'published' }),
      Post.countDocuments({ status: { $ne: 'published' } }),
      Page.countDocuments(),
      SiteMetric.findOne({ key: 'site-page' }).select('viewCount'),
      SiteMetric.findOne({ key: 'blog-page' }).select('viewCount'),
      Post.aggregate([
        { $group: { _id: null, totalViews: { $sum: '$viewCount' } } },
      ]),
      Post.find({})
        .populate('author', 'name')
        .sort({ viewCount: -1, createdAt: -1 })
        .limit(8)
        .select('title slug viewCount status createdAt author'),
      SiteMetric.find({ key: new RegExp(`^${SITE_PATH_METRIC_PREFIX}`) })
        .sort({ viewCount: -1, updatedAt: -1 })
        .limit(10)
        .select('key viewCount updatedAt'),
      Post.find({ createdAt: { $gte: monthStart, $lt: monthEnd } })
        .populate('author', 'name')
        .sort({ createdAt: 1 })
        .select('title slug status createdAt author'),
      User.aggregate([
        {
          $lookup: {
            from: 'posts',
            localField: '_id',
            foreignField: 'author',
            as: 'posts',
          },
        },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            name: 1,
            email: 1,
            role: 1,
            publicationCount: { $size: '$posts' },
            publishedCount: {
              $size: {
                $filter: {
                  input: '$posts',
                  as: 'post',
                  cond: { $eq: ['$$post.status', 'published'] },
                },
              },
            },
          },
        },
        { $sort: { publicationCount: -1, publishedCount: -1, name: 1 } },
      ]),
      Post.aggregate([
        { $unwind: '$tags' },
        {
          $lookup: {
            from: 'tags',
            localField: 'tags',
            foreignField: '_id',
            as: 'tag',
          },
        },
        { $unwind: '$tag' },
        {
          $group: {
            _id: '$tag._id',
            tagName: { $first: '$tag.name' },
            tagSlug: { $first: '$tag.slug' },
            publicationCount: { $sum: 1 },
            totalViews: { $sum: '$viewCount' },
          },
        },
        { $sort: { publicationCount: -1, totalViews: -1, tagName: 1 } },
      ]),
    ]);

    const calendarMap = new Map<string, Array<{ id: string; title: string; slug: string; status: string; authorName: string }>>();
    for (const post of monthPosts) {
      const dateKey = formatCalendarDate(post.createdAt);
      const currentItems = calendarMap.get(dateKey) || [];
      currentItems.push({
        id: String(post._id),
        title: post.title,
        slug: post.slug,
        status: post.status,
        authorName: typeof post.author === 'object' && post.author ? ((post.author as { name?: string }).name || 'Sin autor') : 'Sin autor',
      });
      calendarMap.set(dateKey, currentItems);
    }

    const publicationCalendar = Array.from(calendarMap.entries())
      .map(([date, posts]) => ({ date, count: posts.length, posts }))
      .sort((left, right) => left.date.localeCompare(right.date));

    res.json({
      overview: {
        totalUsers,
        totalPosts,
        publishedPosts,
        draftPosts,
        totalPages,
        siteViewCount: siteMetric?.viewCount || 0,
        blogPageViewCount: blogMetric?.viewCount || 0,
        totalPostViews: totalPostViewsResult[0]?.totalViews || 0,
      },
      publicationCalendar,
      calendarMonth: {
        year,
        month,
      },
      usersByPublicationCount,
      publicationsByTag,
      topPagesByViews: topPagesByViews.map((pageMetric) => {
        const pathname = pageMetric.key.replace(SITE_PATH_METRIC_PREFIX, '') || '/';
        return {
          path: pathname,
          label: humanizePathLabel(pathname),
          viewCount: pageMetric.viewCount || 0,
          lastUpdatedAt: pageMetric.updatedAt,
        };
      }),
      topPostsByViews: topPostsByViews.map((post) => ({
        id: String(post._id),
        title: post.title,
        slug: post.slug,
        viewCount: post.viewCount || 0,
        status: post.status,
        createdAt: post.createdAt,
        authorName: typeof post.author === 'object' && post.author ? ((post.author as { name?: string }).name || 'Sin autor') : 'Sin autor',
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el dashboard administrativo' });
  }
};