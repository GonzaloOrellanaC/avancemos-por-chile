import type { Response } from 'express';
import { Post } from '../models/Post.ts';
import { User } from '../models/User.ts';
import { Notification } from '../models/Notification.ts';
import { Tag } from '../models/Tag.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import slugify from 'slugify';
import jwt from 'jsonwebtoken';
import { generateShareImagesForBanner } from '../lib/shareImages.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
type PostStatus = 'draft' | 'in_review' | 'changes_requested' | 'published';
type PostHistoryAction = 'created' | 'updated' | 'submitted_for_review' | 'changes_requested' | 'resubmitted_for_review' | 'published' | 'moved_to_draft';

const POST_STATUSES = new Set<PostStatus>(['draft', 'in_review', 'changes_requested', 'published']);

function canReviewPosts(role?: string) {
  return role === 'admin' || role === 'editor';
}

function resolveRequestedStatus(requestedStatus: unknown, role?: string, fallback: PostStatus = 'draft') {
  const normalizedStatus = typeof requestedStatus === 'string' && POST_STATUSES.has(requestedStatus as PostStatus)
    ? (requestedStatus as PostStatus)
    : fallback;

  if (role === 'columnista' && normalizedStatus === 'published') {
    return null;
  }

  if (role === 'columnista' && normalizedStatus === 'changes_requested') {
    return null;
  }

  return normalizedStatus;
}

function canAccessUnpublishedPost(role: string | undefined, post: any, userId: string) {
  if (role === 'admin') return true;
  const authorId = String((post.author as any)._id || post.author);
  if (authorId === userId) return true;
  return role === 'editor' && (post.status === 'in_review' || post.status === 'changes_requested');
}

function createHistoryEntry(actor: { id: string; role?: string }, action: PostHistoryAction, status: PostStatus, comment?: string) {
  return {
    action,
    status,
    actor: actor.id,
    actorRole: actor.role || 'columnista',
    comment: comment?.trim() || undefined,
    createdAt: new Date(),
  };
}

async function notifyUsers({
  recipients,
  type,
  title,
  message,
  postId,
  triggeredBy,
}: {
  recipients: string[];
  type: 'review_submitted' | 'changes_requested' | 'post_published';
  title: string;
  message: string;
  postId: string;
  triggeredBy: string;
}) {
  const uniqueRecipients = [...new Set(recipients)].filter((recipientId) => recipientId !== triggeredBy);
  if (!uniqueRecipients.length) return;

  await Notification.insertMany(
    uniqueRecipients.map((recipientId) => ({
      user: recipientId,
      post: postId,
      triggeredBy,
      type,
      title,
      message,
    })),
  );
}

async function getReviewerIds() {
  const reviewers = await User.find({ role: { $in: ['admin', 'editor'] } }, { _id: 1 });
  return reviewers.map((reviewer) => String(reviewer._id));
}

async function safeGenerateShareImages(slug: string, bannerImage?: string | null) {
  try {
    return await generateShareImagesForBanner(slug, bannerImage);
  } catch (error) {
    console.warn('[posts] Could not generate share images', {
      slug,
      bannerImage,
      error,
    });
    return {};
  }
}

function normalizeTagName(input: unknown) {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/\s+/g, ' ');
}

function getTagSlug(input: string) {
  return slugify(input, { lower: true, strict: true, trim: true, locale: 'es' });
}

async function resolvePostTagIds(inputTags: unknown, actorId: string) {
  if (!Array.isArray(inputTags)) return [];

  const normalizedTags = inputTags
    .map((tag) => normalizeTagName(tag))
    .filter(Boolean)
    .map((name) => ({ name, slug: getTagSlug(name) }))
    .filter((tag) => tag.slug);

  const uniqueTags = Array.from(new Map(normalizedTags.map((tag) => [tag.slug, tag])).values());
  if (uniqueTags.length > 5) {
    throw new Error('Cada publicación puede tener un máximo de 5 tags');
  }

  const resolvedTags = await Promise.all(uniqueTags.map(async (tag) => {
    const result = await Tag.findOneAndUpdate(
      { slug: tag.slug },
      { $setOnInsert: { name: tag.name, slug: tag.slug, createdBy: actorId } },
      {
        upsert: true,
        returnDocument: 'after',
      },
    ).select('_id');

    return result?._id || null;
  }));

  return resolvedTags.filter(Boolean);
}

export const getPosts = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(String(req.query.page || '1'), 10) || 1;
    const limit = Math.min(parseInt(String(req.query.limit || '10'), 10) || 10, 50);
    const tagSlug = typeof req.query.tag === 'string' ? req.query.tag.trim() : '';
    const filter: Record<string, unknown> = { status: 'published' };
    let selectedTag: { name: string; slug: string } | null = null;

    if (tagSlug) {
      const tag = await Tag.findOne({ slug: tagSlug }).select('name slug');
      if (!tag) {
        return res.json({ posts: [], total: 0, page, totalPages: 1, limit, selectedTag: null });
      }

      filter.tags = tag._id;
      selectedTag = { name: tag.name, slug: tag.slug };
    }

    const total = await Post.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const posts = await Post.find(filter)
      .populate('author', 'name')
      .populate('tags', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ posts, total, page, totalPages, limit, selectedTag });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener publicaciones' });
  }
};

export const getMyPosts = async (req: AuthRequest, res: Response) => {
  try {
    const posts = await Post.find({ author: req.user.id })
      .populate('tags', 'name slug')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tus publicaciones' });
  }
};

export const getReviewQueue = async (req: AuthRequest, res: Response) => {
  try {
    if (!canReviewPosts(req.user?.role)) {
      return res.status(403).json({ message: 'No tienes permiso para revisar publicaciones' });
    }

    const posts = await Post.find({ status: 'in_review' })
      .populate('author', 'name email role')
      .populate('tags', 'name slug')
      .sort({ updatedAt: -1, createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener publicaciones en revisión' });
  }
};

export const getPostById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id)
      .populate('author', 'name email role')
      .populate('tags', 'name slug')
      .populate('history.actor', 'name role email');
    if (!post) return res.status(404).json({ message: 'Publicación no encontrada' });

    // If published, return publicly
    if (post.status === 'published') {
      return res.json(post);
    }

    // For drafts, require a valid token and either author or admin
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No autorizado' });
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;
      const role = decoded.role;
      if (canAccessUnpublishedPost(role, post, userId)) {
        return res.json(post);
      }
      return res.status(403).json({ message: 'No tienes permiso para ver esta publicación' });
    } catch (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la publicación' });
  }
};

export const getPostBySlug = async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const post = await Post.findOne({ slug })
      .populate('author', 'name email role')
      .populate('tags', 'name slug')
      .populate('history.actor', 'name role email');
    if (!post) return res.status(404).json({ message: 'Publicación no encontrada' });

    if (post.status === 'published') {
      return res.json(post);
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No autorizado' });
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;
      const role = decoded.role;
      if (canAccessUnpublishedPost(role, post, userId)) {
        return res.json(post);
      }
      return res.status(403).json({ message: 'No tienes permiso para ver esta publicación' });
    } catch (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la publicación por slug' });
  }
};

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, bannerImage, status, tags } = req.body;
    const nextStatus = resolveRequestedStatus(status, req.user?.role, 'draft');
    if (!nextStatus) {
      return res.status(403).json({ message: 'El rol columnista no puede publicar directamente' });
    }
    const slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now();
    const shareImages = await safeGenerateShareImages(slug, bannerImage);
    const resolvedTagIds = await resolvePostTagIds(tags, req.user.id);
    
    const post = new Post({
      title,
      slug,
      content,
      bannerImage,
      ...shareImages,
      tags: resolvedTagIds,
      status: nextStatus,
      author: req.user.id,
      history: [
        createHistoryEntry(
          req.user,
          nextStatus === 'in_review' ? 'submitted_for_review' : 'created',
          nextStatus,
        ),
      ],
    });

    await post.save();
  await post.populate('tags', 'name slug');

    if (nextStatus === 'in_review') {
      const reviewerIds = await getReviewerIds();
      await notifyUsers({
        recipients: reviewerIds,
        type: 'review_submitted',
        title: 'Nueva publicación enviada a revisión',
        message: `${req.user.name || 'Un columnista'} envió "${title}" a revisión.`,
        postId: String(post._id),
        triggeredBy: req.user.id,
      });
    }

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear publicación' });
  }
};

export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, bannerImage, status, editorFeedback, tags } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: 'Publicación no encontrada' });

    const isOwner = String(post.author) === req.user.id;
    const isAdmin = req.user?.role === 'admin';
    const isEditorReviewer = req.user?.role === 'editor' && (post.status === 'in_review' || post.status === 'changes_requested');

    if (!isOwner && !isAdmin && !isEditorReviewer) {
      return res.status(403).json({ message: 'No tienes permiso para editar esta publicación' });
    }

    const nextStatus = resolveRequestedStatus(status, req.user?.role, post.status);
    if (!nextStatus) {
      return res.status(403).json({ message: 'El rol columnista no puede publicar directamente' });
    }

    if (req.user?.role === 'columnista' && nextStatus === 'published') {
      return res.status(403).json({ message: 'El rol columnista no puede publicar directamente' });
    }

    if (!canReviewPosts(req.user?.role) && nextStatus === 'changes_requested') {
      return res.status(403).json({ message: 'Solo un editor o administrador puede solicitar cambios' });
    }

    if (nextStatus === 'changes_requested' && !String(editorFeedback || '').trim()) {
      return res.status(400).json({ message: 'Debes agregar comentarios para solicitar cambios' });
    }

    const previousStatus = post.status as PostStatus;
    const resolvedTagIds = await resolvePostTagIds(tags, req.user.id);

    const nextTitle = title || post.title;
    const nextSlug = title && title !== post.title
      ? slugify(nextTitle, { lower: true, strict: true }) + '-' + Date.now()
      : post.slug;
    const nextBannerImage = bannerImage || post.bannerImage;
    const shouldRegenerateShareImages = nextBannerImage && (
      nextBannerImage !== post.bannerImage ||
      !post.bannerImageToShare ||
      !post.bannerImageToShareX
    );
    const shareImages = shouldRegenerateShareImages
      ? await safeGenerateShareImages(nextSlug, nextBannerImage)
      : {
          bannerImageToShare: post.bannerImageToShare,
          bannerImageToShareX: post.bannerImageToShareX,
        };

    post.title = nextTitle;
    post.slug = nextSlug;
    post.content = content || post.content;
    post.bannerImage = nextBannerImage;
    post.bannerImageToShare = shareImages.bannerImageToShare || post.bannerImageToShare;
    post.bannerImageToShareX = shareImages.bannerImageToShareX || post.bannerImageToShareX;
    post.tags = resolvedTagIds;
    post.status = nextStatus;

    const feedbackComment = typeof editorFeedback === 'string' ? editorFeedback.trim() : '';
    const historyAction: PostHistoryAction = nextStatus !== previousStatus
      ? nextStatus === 'changes_requested'
        ? 'changes_requested'
        : nextStatus === 'published'
          ? 'published'
          : nextStatus === 'in_review'
            ? previousStatus === 'changes_requested'
              ? 'resubmitted_for_review'
              : 'submitted_for_review'
            : 'moved_to_draft'
      : 'updated';

    post.history.push(createHistoryEntry(req.user, historyAction, nextStatus, feedbackComment));

    await post.save();
  await post.populate('tags', 'name slug');

    const authorId = String(post.author);
    const reviewerIds = await getReviewerIds();

    if (historyAction === 'submitted_for_review' || historyAction === 'resubmitted_for_review') {
      await notifyUsers({
        recipients: reviewerIds,
        type: 'review_submitted',
        title: historyAction === 'resubmitted_for_review' ? 'Publicación reenviada a revisión' : 'Nueva publicación enviada a revisión',
        message: `${req.user.name || 'Un columnista'} envió "${nextTitle}" a revisión.`,
        postId: String(post._id),
        triggeredBy: req.user.id,
      });
    }

    if (historyAction === 'changes_requested') {
      await notifyUsers({
        recipients: [authorId],
        type: 'changes_requested',
        title: 'Tu publicación requiere cambios',
        message: `${req.user.name || 'Un editor'} dejó feedback en "${nextTitle}": ${feedbackComment}`,
        postId: String(post._id),
        triggeredBy: req.user.id,
      });
    }

    if (historyAction === 'published') {
      await notifyUsers({
        recipients: [authorId, ...reviewerIds],
        type: 'post_published',
        title: 'Publicación marcada como publicada',
        message: `${req.user.name || 'Un editor'} publicó "${nextTitle}".`,
        postId: String(post._id),
        triggeredBy: req.user.id,
      });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar publicación' });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const post = await Post.findOneAndDelete({ _id: id, author: req.user.id });
    if (!post) return res.status(404).json({ message: 'Publicación no encontrada' });
    res.json({ message: 'Publicación eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar publicación' });
  }
};

export const getPostsByAuthor = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const page = parseInt(String(req.query.page || '1'), 10) || 1;
    const limit = Math.min(parseInt(String(req.query.limit || '10'), 10) || 10, 50);
    const filter = { author: id, status: 'published' };

    const total = await Post.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const posts = await Post.find(filter)
      .populate('author', 'name')
      .populate('tags', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ posts, total, page, totalPages, limit });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener publicaciones del autor' });
  }
};
