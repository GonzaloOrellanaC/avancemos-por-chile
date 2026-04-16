import express from 'express';
import { getPosts, getMyPosts, createPost, updatePost, deletePost } from '../controllers/postController.ts';
import { authenticate } from '../middleware/auth.ts';

const router = express.Router();

router.get('/', getPosts);
router.get('/my-posts', authenticate, getMyPosts);
router.post('/', authenticate, createPost);
router.put('/:id', authenticate, updatePost);
router.delete('/:id', authenticate, deletePost);

export default router;
