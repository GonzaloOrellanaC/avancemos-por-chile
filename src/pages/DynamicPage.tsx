import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Target, Eye, Compass, Instagram, AtSign } from 'lucide-react';
import ReactPlayer from 'react-player';
import Hero from '../components/Hero';
import ContactSection from '../components/ContactSection';

const iconMap: any = {
  Target: <Target className="text-brand-red" size={40} />,
  Eye: <Eye className="text-brand-red" size={40} />,
  Compass: <Compass className="text-brand-red" size={40} />
};

const DynamicPage = () => {
  const Player = ReactPlayer as any;
  const { slug } = useParams();
  const [page, setPage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      setIsLoading(true);
      try {
        const targetSlug = slug || 'home';
        const { default: fetchApi } = await import('../lib/api');
        const response = await fetchApi(`/api/pages/${targetSlug}`);
        if (response.ok) {
          const data = await response.json();
          setPage(data);
        }
      } catch (error) {
        console.error('Error fetching page:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-blue" size={48} /></div>;
  if (!page) return <div className="min-h-screen pt-32 text-center text-brand-blue font-bold">Página no encontrada</div>;

  const renderContent = (item: any) => {
    const alignClass = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify'
    }[item.align as string] || 'text-left';

    switch (item.type) {
      case 'title':
        return <h2 className={`text-3xl md:text-5xl font-black mb-4 text-brand-blue ${alignClass}`}>{item.value}</h2>;
      case 'subtitle':
        return <h3 className={`text-xl md:text-2xl font-bold mb-3 text-brand-red ${alignClass}`}>{item.value}</h3>;
      case 'text':
        return <p className={`text-gray-600 leading-relaxed mb-4 whitespace-pre-wrap ${alignClass}`}>{item.value}</p>;
      case 'image':
        return <img src={item.value} alt="" className="w-full rounded-2xl shadow-lg mb-4" />;
      case 'youtube':
      case 'video':
        return (
          <div className="aspect-video mb-4 rounded-2xl overflow-hidden shadow-lg bg-black relative">
            <Player
              url={item.value}
              width="100%"
              height="100%"
              controls
              onError={(e: any) => console.error('ReactPlayer Error:', e)}
              config={{
                youtube: {
                  origin: window.location.origin,
                  enablejsapi: 1
                }
              }}
              className="absolute top-0 left-0"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Dinámico */}
      {page.hero && (
        <DynamicHero config={page.hero} />
      )}

      {/* Secciones Dinámicas */}
      <div className="space-y-0">
        {page.sections.map((section: any, sIdx: number) => (
          <section key={sIdx} className={`py-20 ${section.type === 'cards' ? 'bg-gray-50' : ''}`}>
            <div className="container mx-auto px-4">
              <div className={`grid gap-12 grid-cols-1 md:grid-cols-${section.layout}`}>
                {section.columns.map((col: any, cIdx: number) => (
                  <div key={cIdx} className={section.type === 'cards' ? 'bg-white p-8 rounded-2xl shadow-lg border-t-4 border-brand-red hover:shadow-2xl transition-shadow' : 'space-y-6'}>
                    {section.type === 'cards' && col.icon && (
                      <div className="mb-6">{iconMap[col.icon] || <Target className="text-brand-red" size={40} />}</div>
                    )}
                    {section.type === 'cards' && col.title && (
                      <h3 className="text-2xl font-bold text-brand-blue mb-4">{col.title}</h3>
                    )}
                    {col.content.map((item: any, coIdx: number) => (
                      <div key={coIdx}>
                        {renderContent(item)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Secciones Fijas (Opcional, si quieres que siempre aparezcan) */}
      {page.isHome && (
        <>
          <ContactSection />
        </>
      )}
    </div>
  );
};

const DynamicHero = ({ config }: { config: any }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!config.images || config.images.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % config.images.length);
    }, config.duration || 6000);
    return () => clearInterval(timer);
  }, [config]);

  const currentImg = config.images[currentIndex];
  
  const getAnimation = (type: string) => {
    switch (type) {
      case 'pan-right': return { x: [-20, 20], scale: 1.1 };
      case 'pan-left': return { x: [20, -20], scale: 1.1 };
      case 'zoom': return { scale: [1, 1.2] };
      default: return { scale: [1, 1.1] };
    }
  };

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, ...getAnimation(currentImg?.animation) }}
            exit={{ opacity: 0 }}
            transition={{ 
              opacity: { duration: 1.5 },
              x: { duration: (config.duration || 6000) / 1000, ease: "linear" },
              scale: { duration: (config.duration || 6000) / 1000, ease: "linear" }
            }}
            className="absolute inset-0"
            style={{
              backgroundImage: `url("${currentImg?.url}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </AnimatePresence>
        <div 
          className="absolute inset-0 bg-white backdrop-blur-[2px]" 
          style={{ opacity: config.overlayOpacity || 0.6 }}
        ></div>
      </div>
      <div className="container mx-auto px-4 z-10 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <img src="/isotipo-avancemosporchile.png" alt="Iso" className="h-24 mx-auto mb-8 drop-shadow-md" />
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter text-brand-blue">
            AVANCEMOS <span className="text-brand-red">POR CHILE</span>
          </h1>
          <div className="flex justify-center items-center space-x-4 mb-4">
            <a
              href="https://www.instagram.com/avancemosporchile_cl"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-red transition-colors"
              title="Instagram"
              style={{ color: 'var(--color-brand-blue)' }}
            >
              <Instagram size={22} />
            </a>
            <a
              href="https://www.tiktok.com/@avancemosporchile"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-red transition-colors"
              title="TikTok"
              style={{ color: 'var(--color-brand-blue)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
            </a>
            <a
              href="https://www.threads.net/@avancemosporchile_cl"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-red transition-colors"
              title="Threads"
              style={{ color: 'var(--color-brand-blue)' }}
            >
              <AtSign size={22} />
            </a>
            <a
              href="https://www.youtube.com/@AvancemosPorChile"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-red transition-colors"
              title="YouTube"
              style={{ color: 'var(--color-brand-blue)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M21.8 8s-.2-1.6-.8-2.3c-.7-.9-1.5-.9-1.9-1C16.5 4 12 4 12 4h-.1s-4.5 0-7.1.6c-.4.1-1.2.1-1.9 1C2.4 6.4 2.2 8 2.2 8S2 9.9 2 11.9v.2C2 14.1 2.2 16 2.2 16s.2 1.6.8 2.3c.7.9 1.6.9 2 1 1.4.2 6.8.6 6.8.6s4.5 0 7.1-.6c.4-.1 1.2-.1 1.9-1 .6-.7.8-2.3.8-2.3s.2-1.9.2-3.9v-.2c0-2-.2-3.9-.2-3.9zM10 15V9l5 3-5 3z"/></svg>
            </a>
            <a
              href="https://x.com/AvancemosPorCL"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-red transition-colors"
              title="X"
              style={{ color: 'var(--color-brand-blue)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-twitter-x" viewBox="0 0 16 16">
                <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z"/>
              </svg>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DynamicPage;
