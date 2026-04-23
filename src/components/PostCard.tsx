import React from 'react';
import { motion } from 'motion/react';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PostProp {
  _id: string;
  title: string;
  slug: string;
  bannerImage?: string;
  createdAt: string;
  author?: { _id?: string; name: string };
}

interface Props {
  post: PostProp;
  index?: number;
}

export default function PostCard({ post, index = 0 }: Props) {
  return (
    <motion.article
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
            {post.author?._id ? (
              <Link to={`/u/${post.author._id}`} className="hover:underline">{post.author.name}</Link>
            ) : (
              <span>{post.author?.name}</span>
            )}
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
  );
}
