import express from 'express';
import { authenticate } from '../middleware/auth.ts';
import { getAdminDashboard } from '../controllers/adminController.ts';

const router = express.Router();

router.get('/dashboard', authenticate, getAdminDashboard);

export default router;