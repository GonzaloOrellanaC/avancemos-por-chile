import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PostCard from '../components/PostCard';
import { Loader2, X, Eye } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { shouldTrackView } from '../lib/viewTracking';

interface TagItem {
  _id?: string;
  name: string;
  slug: string;
}

interface Post {
  _id: string;
  title: string;
  slug: string;
  bannerImage: string;
  createdAt: string;
  viewCount: number;
  author: { _id?: string; name: string };
  tags?: TagItem[];
}

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null);
  const [blogPageViewCount, setBlogPageViewCount] = useState(0);
  const LIMIT = 10;
  const activeTagSlug = searchParams.get('tag') || '';

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const { default: fetchApi } = await import('../lib/api');
        const tagQuery = activeTagSlug ? `&tag=${encodeURIComponent(activeTagSlug)}` : '';
        const response = await fetchApi(`/api/posts?page=${page}&limit=${LIMIT}${tagQuery}`);
        const data = await response.json();
        console.log('Fetched posts data:', data);
        // support both shapes: array or { posts, total, page, totalPages, limit }
        const postsArray = Array.isArray(data) ? data : (data.posts || []);
        setPosts(postsArray);
        if (Array.isArray(data)) {
          setTotalPages(1);
        } else {
          setTotalPages(data.totalPages || 1);
          setSelectedTag(data.selectedTag || null);
          setBlogPageViewCount((current) => Math.max(current, data.blogPageViewCount || 0));
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [page, activeTagSlug]);

  useEffect(() => {
    setPage(1);
  }, [activeTagSlug]);

  useEffect(() => {
    const registerVisit = async () => {
      if (!shouldTrackView('blog-page')) {
        return;
      }

      try {
        const { default: fetchApi } = await import('../lib/api');
        const response = await fetchApi('/api/posts/blog/view');
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('application/json')) return;

        const data = await response.json();
        setBlogPageViewCount(data.viewCount || 0);
      } catch (error) {
        console.error('Error registering blog visit:', error);
      }
    };

    registerVisit();
  }, []);

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
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-white px-4 py-2 text-sm font-semibold text-brand-blue shadow-sm">
            <Eye size={16} className="text-brand-red" />
            <span>{blogPageViewCount.toLocaleString('es-CL')} visitas al blog</span>
          </div>
          {selectedTag && (
            <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-brand-blue/10 px-5 py-3 text-brand-blue font-bold">
              <span>Filtrando por #{selectedTag.name}</span>
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="inline-flex items-center justify-center rounded-full bg-white p-1 text-brand-red"
              >
                <X size={14} />
              </button>
            </div>
          )}
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
