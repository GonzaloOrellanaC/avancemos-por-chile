import express from 'express';
import { getPosts, getMyPosts, createPost, updatePost, deletePost, getPostById, getPostsByAuthor, getPostBySlug } from '../controllers/postController.ts';
import { authenticate } from '../middleware/auth.ts';

const router = express.Router();

router.get('/', getPosts);
router.get('/my-posts', authenticate, getMyPosts);
// specific routes above parameter routes to avoid collisions (e.g. 'my-posts' being treated as :id)
router.get('/author/:id', getPostsByAuthor);
// fetch by slug first
router.get('/slug/:slug', /* authenticate, */ getPostBySlug);
router.get('/:id', /* authenticate, */ getPostById);
router.post('/', authenticate, createPost);
router.put('/:id', authenticate, updatePost);
router.delete('/:id', authenticate, deletePost);

export default router;
