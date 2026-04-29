import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowLeft, FileText, Download, Loader2, Eye } from 'lucide-react';
import SharePostButton from '../components/SharePostButton';
import { shouldTrackView } from '../lib/viewTracking';

interface ContentBlock {
  type: 'paragraph' | 'image' | 'pdf';
  value: string;
  caption?: string;
}

interface Post {
  _id: string;
  title: string;
  bannerImage: string;
  content: ContentBlock[];
  createdAt: string;
  viewCount: number;
  author: { _id?: string; name: string };
  tags?: Array<{ _id?: string; name: string; slug: string }>;
}

const PostDetail = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : `/blog/${slug}`;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { default: fetchApi } = await import('../lib/api');
        const response = await fetchApi(`/api/posts/slug/${slug}`);
        const responseContentType = response.headers.get('content-type') || '';
        if (response.ok && responseContentType.includes('application/json')) {
          const data = await response.json();
          setPost(data);

          if (slug && shouldTrackView(`post:${slug}`)) {
            const visitResponse = await fetchApi(`/api/posts/slug/${slug}/view`);
            const visitContentType = visitResponse.headers.get('content-type') || '';
            if (visitResponse.ok && visitContentType.includes('application/json')) {
              const visitData = await visitResponse.json();
              setPost((currentPost) => currentPost ? { ...currentPost, viewCount: visitData.viewCount || currentPost.viewCount || 0 } : currentPost);
            }
          }
        } else {
          setPost(null);
        }
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-blue" size={48} />
    </div>
  );

  if (!post) return (
    <div className="min-h-screen pt-32 text-center">
      <h1 className="text-2xl font-bold text-brand-blue">Publicación no encontrada</h1>
      <Link to="/blog" className="text-brand-red hover:underline mt-4 inline-block">Volver al blog</Link>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-24 bg-white">
      {/* Banner */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        <img 
          src={post.bannerImage || 'https://picsum.photos/seed/banner/1920/1080'} 
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100"
          >
            <Link to="/blog" className="inline-flex items-center space-x-2 text-gray-400 hover:text-brand-blue transition-colors mb-8 group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-bold uppercase text-xs tracking-widest">Volver al blog</span>
            </Link>

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <h1 className="text-4xl md:text-6xl font-black text-brand-blue leading-tight">
                {post.title}
              </h1>
              <SharePostButton title={post.title} url={shareUrl} variant="full" className="md:flex-shrink-0" />
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-12 pb-8 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Calendar size={18} className="text-brand-red" />
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User size={18} className="text-brand-red" />
                {post.author && (post.author._id ? (
                  <Link to={`/u/${post.author._id}`} className="hover:underline">{post.author.name}</Link>
                ) : (
                  <span>{post.author.name}</span>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <Eye size={18} className="text-brand-red" />
                <span>{(post.viewCount || 0).toLocaleString('es-CL')} vistas</span>
              </div>
            </div>

            {!!post.tags?.length && (
              <div className="mb-10 flex flex-wrap gap-3">
                {post.tags.map((tag) => (
                  <Link
                    key={tag.slug}
                    to={`/blog?tag=${encodeURIComponent(tag.slug)}`}
                    className="rounded-full bg-brand-blue/10 px-4 py-2 text-sm font-bold text-brand-blue hover:bg-brand-red hover:text-white"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            <div className="space-y-8">
              {post.content.map((block, index) => (
                <div key={index}>
                  {block.type === 'paragraph' && (
                    <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {block.value}
                    </p>
                  )}
                  {block.type === 'image' && (
                    <figure className="my-12">
                      <img 
                        src={block.value} 
                        alt={block.caption || 'Imagen de la publicación'} 
                        className="w-full rounded-2xl shadow-lg"
                      />
                      {block.caption && (
                        <figcaption className="text-center text-sm text-gray-500 mt-4 italic">
                          {block.caption}
                        </figcaption>
                      )}
                    </figure>
                  )}
                  {block.type === 'pdf' && (
                    <div className="my-8 p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-between group hover:border-brand-blue transition-all">
                      <div className="flex items-center space-x-4">
                        <div className="bg-red-100 p-3 rounded-xl text-red-600">
                          <FileText size={32} />
                        </div>
                        <div>
                          <h4 className="font-bold text-brand-blue">{block.caption || 'Documento Adjunto'}</h4>
                          <p className="text-xs text-gray-400 uppercase font-black">Archivo PDF</p>
                        </div>
                      </div>
                      <a 
                        href={block.value} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-brand-blue text-white p-3 rounded-full hover:bg-brand-red transition-all shadow-lg"
                      >
                        <Download size={24} />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
