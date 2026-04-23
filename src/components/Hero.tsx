import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Instagram, AtSign } from 'lucide-react';

const api = (import.meta as any).env.VITE_API_URL;

const Hero = () => {
  const images = [
    { url: `${api}/public/100.JPG`, animation: { x: [-20, 20], scale: 1.1 } }, // Pan right
    { url: `${api}/public/101.JPG`, animation: { x: [20, -20], scale: 1.1 } }, // Pan left
    { url: `${api}/public/102.JPG`, animation: { scale: [1, 1.2] } }           // Zoom in
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image Slider */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              ...images[currentIndex].animation
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              opacity: { duration: 1.5 },
              x: { duration: 6, ease: "linear" },
              scale: { duration: 6, ease: "linear" }
            }}
            className="absolute inset-0"
            style={{
              backgroundImage: `url("${images[currentIndex].url}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </AnimatePresence>
        {/* Pale/White Overlay to make images look washed out/pale */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <img 
            src="/isotipo-avancemosporchile.png" 
            alt="Isotipo" 
            className="h-24 mx-auto mb-8 drop-shadow-md"
          />
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
          <p className="text-xl md:text-2xl max-w-2xl mx-auto font-medium leading-relaxed text-brand-blue/80">
            Articulación ciudadana técnica para una democracia participativa, directa y no violenta.
          </p>
          <motion.div 
            className="mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <a 
              href="#mision" 
              className="bg-brand-red text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-blue transition-all shadow-xl inline-block"
            >
              Conoce más
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-brand-blue opacity-50"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="w-6 h-10 border-2 border-brand-blue rounded-full flex justify-center p-1">
          <div className="w-1 h-2 bg-brand-blue rounded-full"></div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
