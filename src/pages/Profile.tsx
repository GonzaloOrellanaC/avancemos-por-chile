import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, FileText, Plus, LogOut, Edit, Trash2, Loader2, Layout, Bell, HelpCircle, BarChart, PenLine } from 'lucide-react';
import { toast } from 'sonner';

interface Post {
  _id: string;
  title: string;
  status: string;
  createdAt: string;
}

interface Page {
  _id: string;
  title: string;
  slug: string;
  isHome: boolean;
  status: string;
  createdAt: string;
}

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(storedUser));

    const fetchData = async () => {
      try {
        // Fetch Posts
        const { default: fetchApi } = await import('../lib/api');
        const postsRes = await fetchApi('/api/posts/my-posts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (postsRes.ok) setPosts(await postsRes.json());

        // Fetch Pages
        const pagesRes = await fetchApi('/api/pages', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (pagesRes.ok) setPages(await pagesRes.json());

        // Fetch Notifications and count unread
        try {
          const notifRes = await fetchApi('/api/notifications', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (notifRes.ok) {
            const notifs = await notifRes.json();
            const unread = Array.isArray(notifs) ? notifs.filter((n: any) => !n.readAt).length : 0;
            setUnreadCount(unread);
          }
        } catch (e) {
          console.warn('Could not fetch notifications', e);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Sesión cerrada');
    navigate('/');
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta publicación?')) return;
    try {
      const token = localStorage.getItem('token');
      const { default: fetchApi } = await import('../lib/api');
      const response = await fetchApi(`/api/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setPosts(posts.filter(p => p._id !== id));
        toast.success('Publicación eliminada');
      }
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta página?')) return;
    try {
      const token = localStorage.getItem('token');
      const { default: fetchApi } = await import('../lib/api');
      const response = await fetchApi(`/api/pages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setPages(pages.filter(p => p._id !== id));
        toast.success('Página eliminada');
      }
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  // Create new user (admin only)
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'editor'|'admin'>('editor');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return toast.error('Completa todos los campos');
    setIsCreating(true);
    try {
      const token = localStorage.getItem('token');
      const { default: fetchApi } = await import('../lib/api');
      const response = await fetchApi('/api/auth/create-user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, role: newRole })
      });
      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'Usuario creado');
        setNewName(''); setNewEmail(''); setNewPassword(''); setNewRole('editor');
      } else {
        toast.error(result.message || 'Error al crear usuario');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
              <div className="text-center mb-8">
                <div className="bg-brand-blue/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="text-brand-blue" size={40} />
                </div>
                <h2 className="text-xl font-bold text-brand-blue">{user.name}</h2>
                <p className="text-gray-500 text-sm">{user.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-brand-red/10 text-brand-red text-xs font-bold rounded-full uppercase">
                  {user.role}
                </span>
              </div>

              <nav className="space-y-2">
                <div className="space-y-2">
                  <Link to="/profile/edit" className="w-full flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-50 hover:text-brand-blue rounded-xl transition-all">
                    <Edit size={20} />
                    <span className="font-medium">Editar perfil</span>
                  </Link>
                  {/* moved quick actions to the main quick actions area */}
                  <Link to="/notifications" className="w-full flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-50 hover:text-brand-blue rounded-xl transition-all">
                    <span className="relative inline-flex">
                      <Bell size={20} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-brand-red rounded-full ring-2 ring-white" />
                      )}
                    </span>
                    <span className="font-medium">Notificaciones</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 p-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">Cerrar Sesión</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Quick admin buttons */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
              <div className="flex justify-center">
                <div className="grid w-full grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center">
                  {user?.role === 'admin' && (
                    <>
                      <Link to="/admin/dashboard" className="w-full flex flex-col items-center text-center p-4 hover:bg-gray-50 rounded-lg">
                        <div className="w-20 h-20 rounded-full bg-brand-blue/10 flex items-center justify-center mb-3">
                          <BarChart className="text-brand-blue" size={36} />
                        </div>
                        <div className="text-sm font-semibold">Dashboard</div>
                      </Link>

                      <Link to="/admin/pages" className="w-full flex flex-col items-center text-center p-4 hover:bg-gray-50 rounded-lg">
                        <div className="w-20 h-20 rounded-full bg-brand-blue/10 flex items-center justify-center mb-3">
                          <Layout className="text-brand-blue" size={36} />
                        </div>
                        <div className="text-sm font-semibold">Páginas</div>
                      </Link>

                      <Link to="/admin/users" className="w-full flex flex-col items-center text-center p-4 hover:bg-gray-50 rounded-lg">
                        <div className="w-20 h-20 rounded-full bg-brand-blue/10 flex items-center justify-center mb-3">
                          <User className="text-brand-blue" size={36} />
                        </div>
                        <div className="text-sm font-semibold">Usuarios</div>
                      </Link>

                      <Link to="/blog/manage" className="w-full flex flex-col items-center text-center p-4 hover:bg-gray-50 rounded-lg">
                        <div className="w-20 h-20 rounded-full bg-brand-blue/10 flex items-center justify-center mb-3">
                          <FileText className="text-brand-blue" size={36} />
                        </div>
                        <div className="text-sm font-semibold">Blog</div>
                      </Link>

                      <Link to="/admin/firmas" className="w-full flex flex-col items-center text-center p-4 hover:bg-gray-50 rounded-lg">
                        <div className="w-20 h-20 rounded-full bg-brand-blue/10 flex items-center justify-center mb-3">
                          <PenLine className="text-brand-blue" size={36} />
                        </div>
                        <div className="text-sm font-semibold">Firmas</div>
                      </Link>

                      <Link to="/admin/firmas/editor" className="w-full flex flex-col items-center text-center p-4 hover:bg-gray-50 rounded-lg">
                        <div className="w-20 h-20 rounded-full bg-brand-red/10 flex items-center justify-center mb-3">
                          <Plus className="text-brand-red" size={36} />
                        </div>
                        <div className="text-sm font-semibold">Nueva iniciativa</div>
                      </Link>
                    </>
                  )}

                  {(user?.role === 'editor' || user?.role === 'columnista') && (
                    <Link to="/blog/manage" className="w-full flex flex-col items-center text-center p-4 hover:bg-gray-50 rounded-lg">
                      <div className="w-20 h-20 rounded-full bg-brand-blue/10 flex items-center justify-center mb-3">
                        <FileText className="text-brand-blue" size={36} />
                      </div>
                      <div className="text-sm font-semibold">Blog</div>
                    </Link>
                  )}

                  <Link to="/notifications" className="w-full flex flex-col items-center text-center p-4 hover:bg-gray-50 rounded-lg">
                    <div className="relative w-20 h-20 rounded-full bg-brand-blue/10 flex items-center justify-center mb-3">
                      <Bell className="text-brand-blue" size={36} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-brand-red rounded-full ring-2 ring-white" />
                      )}
                    </div>
                    <div className="text-sm font-semibold">Notificaciones</div>
                  </Link>
                  <Link to="/soporte" className="w-full flex flex-col items-center text-center p-4 hover:bg-gray-50 rounded-lg">
                    <div className="w-20 h-20 rounded-full bg-brand-blue/10 flex items-center justify-center mb-3">
                      <HelpCircle className="text-brand-blue" size={36} />
                    </div>
                    <div className="text-sm font-semibold">Soporte técnico</div>
                  </Link>
                  <Link to="/cargar-nuevo-proyecto" className="w-full flex flex-col items-center text-center p-4 hover:bg-gray-50 rounded-lg">
                    <div className="w-20 h-20 rounded-full bg-brand-blue/10 flex items-center justify-center mb-3">
                      <Plus className="text-brand-blue" size={36} />
                    </div>
                    <div className="text-sm font-semibold">Cargar nuevo proyecto</div>
                  </Link>
                  <Link to="/mis-envios" className="w-full flex flex-col items-center text-center p-4 hover:bg-gray-50 rounded-lg">
                    <div className="w-20 h-20 rounded-full bg-brand-blue/10 flex items-center justify-center mb-3">
                      <FileText className="text-brand-blue" size={36} />
                    </div>
                    <div className="text-sm font-semibold">Mis envíos</div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
