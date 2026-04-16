import { Response } from 'express';
import { Post } from '../models/Post.ts';
import { AuthRequest } from '../middleware/auth.ts';
import slugify from 'slugify';

export const getPosts = async (req: AuthRequest, res: Response) => {
  try {
    const posts = await Post.find({ status: 'published' }).populate('author', 'name').sort({ createdAt: -1 });
    res.json(posts);
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

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, bannerImage, status } = req.body;
    const slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now();
    
    const post = new Post({
      title,
      slug,
      content,
      bannerImage,
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

    post.title = title || post.title;
    post.content = content || post.content;
    post.bannerImage = bannerImage || post.bannerImage;
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
