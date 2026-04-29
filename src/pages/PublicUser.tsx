import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import PostCard from '../components/PostCard';

export default function PublicUser() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const LIMIT = 10;

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        const { default: fetchApi } = await import('../lib/api');
        const res = await fetchApi(`/api/auth/users/${id}`);
        if (!res.ok) {
          setUser(null);
          return;
        }
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, [id]);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const { default: fetchApi } = await import('../lib/api');
        const postsRes = await fetchApi(`/api/posts/author/${id}?page=${page}&limit=${LIMIT}`);
        if (postsRes.ok) {
          const data = await postsRes.json();
          const postsArray = Array.isArray(data) ? data : (data.posts || []);
          setPosts(postsArray);
          if (Array.isArray(data)) {
            setTotalPages(1);
          } else {
            setTotalPages(data.totalPages || 1);
          }
        } else {
          setPosts([]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (id) loadPosts();
  }, [id, page]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-blue" size={48} /></div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center">Perfil no disponible</div>;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 mb-6">
          <div className="flex flex-col items-center text-center gap-4 md:flex-row md:items-center md:text-left">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
              {user.profileImage ? <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">No hay</div>}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-blue">{user.name}</h1>
              {user.shortDescription && <p className="text-gray-600 mt-1">{user.shortDescription}</p>}
            </div>
          </div>

          {user.longDescription && (
            <div className="mt-6 text-gray-700">
              <h2 className="text-lg font-bold mb-2">Sobre el autor</h2>
              <p>{user.longDescription}</p>
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold text-brand-blue mb-4">Entradas del autor</h2>
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((p, i) => (
                <PostCard key={p._id} post={p} index={i} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No hay publicaciones públicas de este autor.</p>
          )}
            {/* Pagination controls */}
            {posts.length > 0 && (
              <div className="mt-8 flex items-center justify-center space-x-4">
                <button
                  className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Anterior
                </button>
                <div className="text-sm text-gray-600">Página {page} de {totalPages}</div>
                <button
                  className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Siguiente
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
