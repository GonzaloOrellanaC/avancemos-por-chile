import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Facebook, Twitter, Instagram } from 'lucide-react';

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
              <a href="#" className="text-gray-300 hover:text-white transition-colors"><Facebook size={24} /></a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors"><Twitter size={24} /></a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors"><Instagram size={24} /></a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Avancemos Por Chile. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
