import type { Response } from 'express';
import { Post } from '../models/Post.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import slugify from 'slugify';
import jwt from 'jsonwebtoken';
import { generateShareImagesForBanner } from '../lib/shareImages.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

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

export const getPosts = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(String(req.query.page || '1'), 10) || 1;
    const limit = Math.min(parseInt(String(req.query.limit || '10'), 10) || 10, 50);
    const filter = { status: 'published' };

    const total = await Post.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const posts = await Post.find(filter)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ posts, total, page, totalPages, limit });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener publicaciones' });
  }
};

export const getMyPosts = async (req: AuthRequest, res: Response) => {
  try {
    const posts = await Post.find({ author: req.user.id }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tus publicaciones' });
  }
};

export const getPostById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id).populate('author', 'name email role');
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
      if (role === 'admin' || userId === String((post.author as any)._id || post.author)) {
        return res.json(post);
      }
      return res.status(403).json({ message: 'No tienes permiso para ver este borrador' });
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
    const post = await Post.findOne({ slug }).populate('author', 'name email role');
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
      if (role === 'admin' || userId === String((post.author as any)._id || post.author)) {
        return res.json(post);
      }
      return res.status(403).json({ message: 'No tienes permiso para ver este borrador' });
    } catch (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la publicación por slug' });
  }
};

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, bannerImage, status } = req.body;
    const slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now();
    const shareImages = await safeGenerateShareImages(slug, bannerImage);
    
    const post = new Post({
      title,
      slug,
      content,
      bannerImage,
      ...shareImages,
      status,
      author: req.user.id
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear publicación' });
  }
};

export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, bannerImage, status } = req.body;
    
    const post = await Post.findOne({ _id: id, author: req.user.id });
    if (!post) return res.status(404).json({ message: 'Publicación no encontrada' });

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
    post.status = status || post.status;

    await post.save();
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
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ posts, total, page, totalPages, limit });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener publicaciones del autor' });
  }
};
