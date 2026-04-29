import type { Response } from 'express';
import { Notification } from '../models/Notification.ts';
import type { AuthRequest } from '../middleware/auth.ts';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .populate('post', 'title slug status')
      .populate('triggeredBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
};

export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { readAt: new Date() },
      { returnDocument: 'after' },
    )
      .populate('post', 'title slug status')
      .populate('triggeredBy', 'name role');

    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la notificación' });
  }
};

export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, readAt: null },
      { readAt: new Date() },
    );

    res.json({ message: 'Notificaciones marcadas como leídas' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar las notificaciones' });
  }
};