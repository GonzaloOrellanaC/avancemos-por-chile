import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    const stored = localStorage.getItem('user');
    if (stored) setLoggedUser(JSON.parse(stored));
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'user') setLoggedUser(e.newValue ? JSON.parse(e.newValue) : null);
    };
    const onUserUpdated = () => {
      const stored = localStorage.getItem('user');
      setLoggedUser(stored ? JSON.parse(stored) : null);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('user-updated', onUserUpdated as EventListener);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('user-updated', onUserUpdated as EventListener);
    };
  }, []);

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contacto', path: '/#contacto' },
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
            to={loggedUser ? '/profile' : '/login'} 
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              scrolled || !isHomePage 
                ? 'bg-brand-blue text-white hover:bg-brand-red' 
                : 'bg-white text-brand-blue hover:bg-brand-red hover:text-white'
            }`}
          >
            {loggedUser ? 'Perfil' : 'Ingresar'}
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
                to={loggedUser ? '/profile' : '/login'} 
                className="bg-brand-blue text-white px-4 py-2 rounded-full font-bold text-center"
                onClick={() => setIsOpen(false)}
              >
                {loggedUser ? 'Perfil' : 'Ingresar'}
              </Link>
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
