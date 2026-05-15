import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    const fetchNotification = async () => {
      try {
        const { default: fetchApi } = await import('../lib/api');
        const res = await fetchApi(`/api/notifications/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('No se pudo cargar la notificación');
        const data = await res.json();
        setNotification(data);

        // mark as read
        await fetchApi(`/api/notifications/${id}/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        toast.error((err as Error).message || 'Error al cargar la notificación');
        navigate('/notifications');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotification();
  }, [id, navigate]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-blue" size={32} /></div>;
  if (!notification) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="inline-flex items-center space-x-2 text-brand-blue hover:underline">
            <ArrowLeft size={18} />
            <span>Atrás</span>
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl shadow-md p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center">
              <Bell className="text-brand-blue" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-brand-blue">{notification.title}</h1>
              <p className="text-sm text-gray-400">{new Date(notification.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="prose max-w-none text-gray-700">
            <p>{notification.message}</p>
            {notification.post && (
              <p className="mt-6">
                <Link to={notification.post.status === 'published' ? `/blog/${notification.post.slug}` : `/editor/${notification.post._id}`} className="text-brand-blue font-bold">
                  Ver elemento relacionado
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
