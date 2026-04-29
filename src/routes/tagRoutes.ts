import express from 'express';
import { authenticate } from '../middleware/auth.ts';
import { createTag, getTags } from '../controllers/tagController.ts';

const router = express.Router();

router.get('/', authenticate, getTags);
router.post('/', authenticate, createTag);

export default router;