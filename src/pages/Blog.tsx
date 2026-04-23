import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PostCard from '../components/PostCard';
import { Loader2 } from 'lucide-react';

interface Post {
  _id: string;
  title: string;
  slug: string;
  bannerImage: string;
  createdAt: string;
  author: { _id?: string; name: string };
}

const Blog = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const LIMIT = 10;

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { default: fetchApi } = await import('../lib/api');
        const response = await fetchApi(`/api/posts?page=${page}&limit=${LIMIT}`);
        const data = await response.json();
        console.log('Fetched posts data:', data);
        // support both shapes: array or { posts, total, page, totalPages, limit }
        const postsArray = Array.isArray(data) ? data : (data.posts || []);
        setPosts(postsArray);
        if (Array.isArray(data)) {
          setTotalPages(1);
        } else {
          setTotalPages(data.totalPages || 1);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [page]);

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <header className="mb-12 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-brand-blue mb-4"
          >
            NOTICIAS Y <span className="text-brand-red">ARTÍCULOS</span>
          </motion.h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Mantente informado sobre nuestras actividades, propuestas y la actualidad nacional.
          </p>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-brand-blue" size={48} />
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <PostCard key={post._id} post={post} index={index} />
            ))}
          </div>
          ) : null}

        {/* Pagination controls */}
        {!isLoading && (posts.length > 0) ? 
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
         : 
          <div className="text-center py-24">
            <p className="text-gray-500 text-xl">No hay publicaciones disponibles en este momento.</p>
          </div>
        }
      </div>
    </div>
  );
};

export default Blog;
