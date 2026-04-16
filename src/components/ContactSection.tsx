import React from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight } from 'lucide-react';

const ContactSection = () => {
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
