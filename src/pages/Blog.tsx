import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, User, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Post {
  _id: string;
  title: string;
  slug: string;
  bannerImage: string;
  createdAt: string;
  author: { name: string };
}

const Blog = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { default: fetchApi } = await import('../lib/api');
        const response = await fetchApi('/api/posts');
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
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
        </header>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-brand-blue" size={48} />
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <motion.article
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group"
              >
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={post.bannerImage || 'https://picsum.photos/seed/post/800/600'} 
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User size={14} />
                      <span>{post.author.name}</span>
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-brand-blue mb-4 line-clamp-2 group-hover:text-brand-red transition-colors">
                    {post.title}
                  </h2>
                  
                  <Link 
                    to={`/blog/${post.slug}`}
                    className="inline-flex items-center space-x-2 text-brand-blue font-bold hover:text-brand-red transition-colors"
                  >
                    <span>Leer más</span>
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-gray-500 text-xl">No hay publicaciones disponibles en este momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
