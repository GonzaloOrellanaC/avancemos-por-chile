import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Instagram, AtSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const TikTokIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contacto', path: '/#contacto' },
  ];

  const socialLinks = [
    { 
      name: 'Instagram', 
      url: 'https://www.instagram.com/avancemosporchile_cl',
      icon: <Instagram size={20} />
    },
    { 
      name: 'TikTok', 
      url: 'https://www.tiktok.com/@avancemosporchile',
      icon: <TikTokIcon size={20} />
    },
    { 
      name: 'Threads', 
      url: 'https://www.threads.net/@avancemosporchile_cl',
      icon: <AtSign size={20} />
    }
  ];

  const isHomePage = location.pathname === '/';

  return (
    <header 
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled || !isHomePage ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <img 
            src="/logo-avancemosporchile.png" 
            alt="Avancemos Por Chile" 
            className="h-12 md:h-16"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-6 items-center">
          <div className="flex items-center space-x-4 mr-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`transition-colors hover:text-brand-red ${
                  scrolled || !isHomePage ? 'text-brand-blue' : 'text-white'
                }`}
                title={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`font-bold transition-colors hover:text-brand-red ${
                scrolled || !isHomePage ? 'text-brand-blue' : 'text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <Link 
            to="/login" 
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              scrolled || !isHomePage 
                ? 'bg-brand-blue text-white hover:bg-brand-red' 
                : 'bg-white text-brand-blue hover:bg-brand-red hover:text-white'
            }`}
          >
            Ingresar
          </Link>
        </nav>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X size={28} className="text-brand-blue" />
          ) : (
            <Menu size={28} className={scrolled || !isHomePage ? 'text-brand-blue' : 'text-white'} />
          )}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="flex flex-col p-4 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-brand-blue font-medium text-lg"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <Link 
                to="/login" 
                className="bg-brand-blue text-white px-4 py-2 rounded-full font-bold text-center"
                onClick={() => setIsOpen(false)}
              >
                Ingresar
              </Link>
              <div className="flex justify-center space-x-6 pt-4 border-t border-gray-100">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-blue hover:text-brand-red transition-colors"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
