import express from 'express';
import { getPosts, getMyPosts, getReviewQueue, createPost, updatePost, deletePost, getPostById, getPostsByAuthor, getPostBySlug, incrementBlogPageView, incrementPostView, getBlogCountryMetrics, getBlogPageView, trackSitePageView, getSiteCountryMetrics } from '../controllers/postController.ts';
import { authenticate } from '../middleware/auth.ts';

const router = express.Router();

router.get('/', getPosts);
router.post('/blog/view', incrementBlogPageView);
router.get('/blog/view', getBlogPageView);
router.get('/blog/countries', authenticate, getBlogCountryMetrics);
router.post('/site/view', trackSitePageView);
router.get('/site/countries', authenticate, getSiteCountryMetrics);
router.get('/my-posts', authenticate, getMyPosts);
router.get('/review-queue', authenticate, getReviewQueue);
// specific routes above parameter routes to avoid collisions (e.g. 'my-posts' being treated as :id)
router.get('/author/:id', getPostsByAuthor);
// fetch by slug first
router.post('/slug/:slug/view', incrementPostView);
router.get('/slug/:slug/view', incrementPostView);
router.get('/slug/:slug', /* authenticate, */ getPostBySlug);
router.get('/:id', /* authenticate, */ getPostById);
router.post('/', authenticate, createPost);
router.put('/:id', authenticate, updatePost);
router.delete('/:id', authenticate, deletePost);

export default router;
