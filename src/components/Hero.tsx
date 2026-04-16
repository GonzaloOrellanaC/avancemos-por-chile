import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const Hero = () => {
  const images = [
    { url: '/100.jpg', animation: { x: [-20, 20], scale: 1.1 } }, // Pan right
    { url: '/101.jpg', animation: { x: [20, -20], scale: 1.1 } }, // Pan left
    { url: '/102.jpg', animation: { scale: [1, 1.2] } }           // Zoom in
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
