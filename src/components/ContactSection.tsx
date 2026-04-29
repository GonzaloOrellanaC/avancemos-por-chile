import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import fetchApi from '../lib/api';

interface ContactSectionPost {
  _id: string;
  title: string;
  slug: string;
  bannerImage?: string;
  createdAt: string;
}

const ContactSection = () => {
  const [latestPosts, setLatestPosts] = useState<ContactSectionPost[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadLatestPosts = async () => {
      try {
        const response = await fetchApi('/api/posts?page=1&limit=3');
        const data = await response.json();
        const posts = Array.isArray(data) ? data : (data.posts || []);

        if (isMounted) {
          setLatestPosts(posts.slice(0, 3));
        }
      } catch (error) {
        console.error('Error loading latest posts for contact section:', error);
      }
    };

    loadLatestPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="contacto" className="py-24 bg-brand-blue text-white overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-red/5 rounded-full -ml-48 -mb-48 blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl font-black mb-8">¿QUIERES SER PARTE DEL CAMBIO?</h2>
            <p className="text-xl text-gray-300 mb-12 font-light">
              Estamos construyendo una nueva forma de hacer política, desde la técnica y la ciudadanía. Escríbenos y avancemos juntos.
            </p>

            <div className="mb-14 text-left">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.24em] text-brand-red">Ultimas publicaciones</p>
                  <p className="mt-2 text-base text-slate-200">Revisa lo más reciente antes de escribirnos.</p>
                </div>
                <Link
                  to="/blog"
                  className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white hover:text-brand-blue md:inline-flex"
                >
                  Ir al blog
                  <ChevronRight size={16} />
                </Link>
              </div>

              <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4">
                {latestPosts.map((post) => (
                  <Link
                    key={post._id}
                    to={`/blog/${post.slug}`}
                    className="group min-w-[280px] max-w-[280px] snap-start overflow-hidden rounded-[28px] border border-white/10 bg-white text-brand-blue shadow-2xl transition-transform hover:-translate-y-1 md:min-w-[320px] md:max-w-[320px]"
                  >
                    <div className="h-44 overflow-hidden bg-slate-200">
                      <img
                        src={post.bannerImage || 'https://picsum.photos/seed/contact-section-post/800/600'}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex min-h-[180px] flex-col p-6">
                      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        <Calendar size={14} className="text-brand-red" />
                        <span>{new Date(post.createdAt).toLocaleDateString('es-CL')}</span>
                      </div>
                      <h3 className="text-2xl font-black leading-tight text-brand-blue transition-colors group-hover:text-brand-red line-clamp-3">
                        {post.title}
                      </h3>
                      <div className="mt-auto pt-6 text-sm font-bold text-brand-blue transition-colors group-hover:text-brand-red">
                        Leer publicación
                      </div>
                    </div>
                  </Link>
                ))}

                <Link
                  to="/blog"
                  className="flex min-w-[280px] max-w-[280px] snap-start flex-col justify-between rounded-[28px] border border-white/20 bg-brand-red p-6 text-white shadow-2xl transition-transform hover:-translate-y-1 hover:bg-white hover:text-brand-red md:min-w-[320px] md:max-w-[320px]"
                >
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.24em] text-white/70">Explorar</p>
                    <h3 className="mt-6 text-4xl font-black leading-none">Ver mas</h3>
                    <p className="mt-4 text-sm leading-6 text-white/90">
                      Entra al blog para revisar todas las noticias, columnas y articulos publicados.
                    </p>
                  </div>
                  <div className="mt-8 inline-flex items-center gap-3 text-base font-bold">
                    Ir al blog
                    <ArrowRight size={20} />
                  </div>
                </Link>
              </div>
            </div>

            <div className="inline-block group max-w-full">
              <a 
                href="mailto:contacto@avancemosporchile.cl"
                className="flex flex-col md:flex-row items-center bg-white text-brand-blue p-1 rounded-3xl md:rounded-full shadow-2xl hover:bg-brand-red hover:text-white transition-all duration-500 overflow-hidden"
              >
                <div className="bg-brand-red text-white p-3 md:p-4 rounded-full m-1 group-hover:bg-white group-hover:text-brand-red transition-colors">
                  <Mail className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <span className="text-base sm:text-lg md:text-3xl font-bold px-4 md:px-8 py-3 md:py-0 break-all md:break-normal">
                  contacto@avancemosporchile.cl
                </span>
                <div className="hidden md:flex bg-brand-blue text-white p-4 rounded-full m-1 group-hover:bg-white group-hover:text-brand-blue transition-colors">
                  <ArrowRight size={32} />
                </div>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
