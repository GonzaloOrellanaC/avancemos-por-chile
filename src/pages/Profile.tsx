import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, FileText, Plus, LogOut, Edit, Trash2, Loader2, Layout } from 'lucide-react';
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

      if (response.ok) {
        toast.success('Usuario creado');
        setNewName(''); setNewEmail(''); setNewPassword(''); setNewRole('editor');
      } else {
        const err = await response.json();
        toast.error(err.message || 'Error al crear usuario');
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
                <div className="flex gap-6 items-center">
                  {user?.role === 'admin' && (
                    <>
                      <Link to="/admin/pages" className="flex flex-col items-center text-center p-4 hover:bg-gray-50 rounded-lg">
                        <div className="w-20 h-20 rounded-full bg-brand-blue/10 flex items-center justify-center mb-3">
                          <Layout className="text-brand-blue" size={36} />
                        </div>
                        <div className="text-sm font-semibold">Páginas</div>
                      </Link>

                      <Link to="/admin/users" className="flex flex-col items-center text-center p-4 hover:bg-gray-50 rounded-lg">
                        <div className="w-20 h-20 rounded-full bg-brand-blue/10 flex items-center justify-center mb-3">
                          <User className="text-brand-blue" size={36} />
                        </div>
                        <div className="text-sm font-semibold">Usuarios</div>
                      </Link>
                    </>
                  )}

                  {user?.role === 'editor' && (
                    <Link to="/admin/blog" className="flex flex-col items-center text-center p-4 hover:bg-gray-50 rounded-lg">
                      <div className="w-20 h-20 rounded-full bg-brand-blue/10 flex items-center justify-center mb-3">
                        <FileText className="text-brand-blue" size={36} />
                      </div>
                      <div className="text-sm font-semibold">Blog</div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
            {/* User creation (admin only) */}
            {/* {user?.role === 'admin' && (
              <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <h2 className="text-xl font-bold text-brand-blue mb-4">Crear nuevo usuario</h2>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre" className="p-3 bg-gray-50 rounded-lg" />
                  <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Correo" className="p-3 bg-gray-50 rounded-lg" />
                  <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Contraseña" type="password" className="p-3 bg-gray-50 rounded-lg" />
                  <div className="flex items-center space-x-2">
                    <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)} className="p-3 bg-gray-50 rounded-lg">
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button disabled={isCreating} className="bg-brand-blue text-white px-4 py-2 rounded-lg font-bold">{isCreating ? 'Creando...' : 'Crear'}</button>
                  </div>
                </form>
              </div>
            )} */}
            {/* Pages Management */}
            {/* <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-brand-blue flex items-center space-x-3">
                  <Layout className="text-brand-red" size={32} />
                  <span>Páginas del Sitio</span>
                </h1>
                <Link 
                  to="/page-editor/new" 
                  className="bg-brand-red text-white px-6 py-3 rounded-full font-bold flex items-center space-x-2 hover:bg-brand-blue transition-all shadow-lg"
                >
                  <Plus size={20} />
                  <span>Nueva Página</span>
                </Link>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand-blue" size={32} /></div>
              ) : pages.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-gray-100">
                        <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Título</th>
                        <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Slug</th>
                        <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pages.map((page) => (
                        <tr key={page._id} className="group">
                          <td className="py-4 font-bold text-brand-blue">
                            {page.title} {page.isHome && <span className="ml-2 text-[10px] bg-brand-blue text-white px-2 py-0.5 rounded-full">INICIO</span>}
                          </td>
                          <td className="py-4 text-sm text-gray-500">/{page.slug}</td>
                          <td className="py-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <Link to={`/page-editor/${page.slug}`} className="p-2 text-gray-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-all"><Edit size={18} /></Link>
                              {!page.isHome && <button onClick={() => handleDeletePage(page._id)} className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-400 mb-4">No hay páginas dinámicas creadas.</p>
                </div>
              )}
            </div> */}

            {/* Posts Management */}
            {/* <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-brand-blue flex items-center space-x-3">
                  <FileText className="text-brand-red" size={32} />
                  <span>Entradas del Blog</span>
                </h1>
                <Link 
                  to="/editor" 
                  className="bg-brand-blue text-white px-6 py-3 rounded-full font-bold flex items-center space-x-2 hover:bg-brand-red transition-all shadow-lg"
                >
                  <Plus size={20} />
                  <span>Nueva Entrada</span>
                </Link>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand-blue" size={32} /></div>
              ) : posts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-gray-100">
                        <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Título</th>
                        <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Estado</th>
                        <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {posts.map((post) => (
                        <tr key={post._id} className="group">
                          <td className="py-4 font-bold text-brand-blue">{post.title}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${
                              post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {post.status === 'published' ? 'Publicado' : 'Borrador'}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <Link to={`/editor/${post._id}`} className="p-2 text-gray-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-all"><Edit size={18} /></Link>
                              <button onClick={() => handleDeletePost(post._id)} className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-400 mb-4">No hay entradas en el blog.</p>
                </div>
              )}
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
