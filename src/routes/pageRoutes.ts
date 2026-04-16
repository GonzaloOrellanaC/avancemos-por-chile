import express from 'express';
import { getPages, getPageBySlug, upsertPage, deletePage } from '../controllers/pageController.ts';
import { authenticate } from '../middleware/auth.ts';

const router = express.Router();

router.get('/', getPages);
router.get('/:slug', getPageBySlug);
router.post('/', authenticate, upsertPage);
router.delete('/:id', authenticate, deletePage);

export default router;
