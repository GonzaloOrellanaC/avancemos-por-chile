import express from 'express';
import { authenticate } from '../middleware/auth.ts';
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../controllers/notificationController.ts';

const router = express.Router();

router.get('/', authenticate, getNotifications);
router.post('/mark-all-read', authenticate, markAllNotificationsAsRead);
router.post('/:id/read', authenticate, markNotificationAsRead);

export default router;