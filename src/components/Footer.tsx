import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Instagram, AtSign } from 'lucide-react';

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

const Footer = () => {
  return (
    <footer className="bg-brand-blue text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <img 
              src="/logo-avancemosporchile.png" 
              alt="Avancemos Por Chile" 
              className="h-12 brightness-0 invert"
            />
            <p className="text-gray-300 max-w-xs">
              Movimiento político dedicado a empoderar a la ciudadanía mediante formación técnica y espacios de diálogo.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xl font-bold mb-4 border-b-2 border-brand-red inline-block">Enlaces</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Inicio</Link></li>
              <li><Link to="/blog" className="text-gray-300 hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/login" className="text-gray-300 hover:text-white transition-colors">Acceso Editores</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4 border-b-2 border-brand-red inline-block">Contacto</h3>
            <div className="flex items-center space-x-3 text-gray-300 mb-4">
              <Mail size={20} />
              <a href="mailto:contacto@avancemosporchile.cl" className="hover:text-white transition-colors">
                contacto@avancemosporchile.cl
              </a>
            </div>
            <div className="flex space-x-4">
              <a 
                href="https://www.instagram.com/avancemosporchile_cl" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white hover:text-brand-red transition-colors"
                title="Instagram"
              >
                <Instagram size={24} />
              </a>
              <a 
                href="https://www.tiktok.com/@avancemosporchile" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white hover:text-brand-red transition-colors"
                title="TikTok"
              >
                <TikTokIcon size={24} />
              </a>
              <a 
                href="https://www.threads.net/@avancemosporchile_cl" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white hover:text-brand-red transition-colors"
                title="Threads"
              >
                <AtSign size={24} />
              </a>
              <a
                href="https://www.youtube.com/@AvancemosPorChile"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-brand-red transition-colors"
                title="YouTube"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21.8 8s-.2-1.6-.8-2.3c-.7-.9-1.5-.9-1.9-1C16.5 4 12 4 12 4h-.1s-4.5 0-7.1.6c-.4.1-1.2.1-1.9 1C2.4 6.4 2.2 8 2.2 8S2 9.9 2 11.9v.2C2 14.1 2.2 16 2.2 16s.2 1.6.8 2.3c.7.9 1.6.9 2 1 1.4.2 6.8.6 6.8.6s4.5 0 7.1-.6c.4-.1 1.2-.1 1.9-1 .6-.7.8-2.3.8-2.3s.2-1.9.2-3.9v-.2c0-2-.2-3.9-.2-3.9zM10 15V9l5 3-5 3z"/></svg>
              </a>
              <a
                href="https://x.com/AvancemosPorCL"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-brand-red transition-colors"
                title="X"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-twitter-x" viewBox="0 0 16 16">
                  <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Avancemos Por Chile. Todos los derechos reservados.</p>
          <p className="mt-2">Diseñado y desarrollado por <a href="https://omtecnologia.cl" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white font-semibold">OM Tecnología</a></p>
          <div className="mt-1">
            <Link to="/privacy" className="text-gray-400 hover:text-white mr-4">Política de Privacidad</Link>
            <Link to="/legal" className="text-gray-400 hover:text-white">Aviso Legal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
