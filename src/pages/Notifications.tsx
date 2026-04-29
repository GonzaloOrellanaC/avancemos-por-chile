import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationItem {
  _id: string;
  type: 'review_submitted' | 'changes_requested' | 'post_published';
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
  post?: {
    _id: string;
    title: string;
    slug: string;
    status: 'draft' | 'in_review' | 'changes_requested' | 'published';
  };
  triggeredBy?: {
    name: string;
    role: string;
  };
}

function getNotificationLink(notification: NotificationItem) {
  if (!notification.post) return '/profile';
  if (notification.post.status === 'published') return `/blog/${notification.post.slug}`;
  return `/editor/${notification.post._id}`;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      navigate('/login');
      return;
    }

    const fetchNotifications = async () => {
      try {
        const { default: fetchApi } = await import('../lib/api');
        const response = await fetchApi('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorResult = await response.json().catch(() => ({}));
          throw new Error(errorResult.message || 'No se pudieron cargar las notificaciones');
        }

        setNotifications(await response.json());
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Error al cargar notificaciones');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [navigate]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications],
  );

  const handleMarkAsRead = async (notificationId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setNotifications((current) => current.map((item) => (
      item._id === notificationId && !item.readAt
        ? { ...item, readAt: new Date().toISOString() }
        : item
    )));

    try {
      const { default: fetchApi } = await import('../lib/api');
      await fetchApi(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Error marking notification as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token || unreadCount === 0) return;

    setIsMarkingAll(true);
    try {
      const { default: fetchApi } = await import('../lib/api');
      const response = await fetchApi('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('No se pudieron marcar las notificaciones');
      }

      const now = new Date().toISOString();
      setNotifications((current) => current.map((item) => ({ ...item, readAt: item.readAt || now })));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar notificaciones');
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button onClick={() => navigate(-1)} className="inline-flex items-center space-x-2 text-brand-blue hover:underline">
            <ArrowLeft size={18} />
            <span>Atrás</span>
          </button>
          <button
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll || unreadCount === 0}
            className="inline-flex items-center space-x-2 rounded-full bg-brand-blue px-5 py-2 text-white font-bold disabled:opacity-60"
          >
            {isMarkingAll ? <Loader2 size={18} className="animate-spin" /> : <CheckCheck size={18} />}
            <span>Marcar todas como leídas</span>
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl shadow-md overflow-hidden">
          <div className="border-b border-gray-100 px-8 py-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center">
                <Bell className="text-brand-blue" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-brand-blue">Notificaciones</h1>
                <p className="text-sm text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} pendientes de lectura` : 'No tienes notificaciones pendientes'}
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-blue" size={32} /></div>
          ) : notifications.length === 0 ? (
            <div className="px-8 py-20 text-center bg-gray-50">
              <p className="text-gray-400">Todavía no hay notificaciones para tu cuenta.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <Link
                  key={notification._id}
                  to={getNotificationLink(notification)}
                  onClick={() => handleMarkAsRead(notification._id)}
                  className={`block px-8 py-6 transition-colors hover:bg-gray-50 ${notification.readAt ? 'bg-white' : 'bg-brand-blue/[0.03]'}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-brand-blue">{notification.title}</h2>
                        {!notification.readAt && <span className="rounded-full bg-brand-red/10 px-2 py-1 text-[10px] font-black uppercase text-brand-red">Nueva</span>}
                      </div>
                      <p className="text-gray-600 leading-relaxed">{notification.message}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs uppercase tracking-wider text-gray-400 font-bold">
                        <span>{new Date(notification.createdAt).toLocaleString()}</span>
                        {notification.triggeredBy?.name && <span>{notification.triggeredBy.name} · {notification.triggeredBy.role}</span>}
                        {notification.post?.title && <span>{notification.post.title}</span>}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-brand-red">Ver detalle</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}