import React from 'react';
import { MessageSquare, Users, ArrowRight } from 'lucide-react';

const JoinWhatsApp = () => {
  return (
    <div id="join-whatsapp" className="mt-8 max-w-xl mx-auto">
      <div className="rounded-2xl bg-white/5 p-6 text-left md:text-center">
        <div className="flex items-start md:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
            <MessageSquare className="text-brand-red" size={28} />
          </div>
          <div className="flex-1">
            <h4 className="text-3xl md:text-4xl font-black text-white mb-2">Únete a nuestro grupo de WhatsApp</h4>
            <p className="text-base md:text-lg text-slate-200 mt-2">
              Participa en conversaciones, comparte ideas y recibe actualizaciones. El grupo es un espacio para diálogo respetuoso y colaboración.
            </p>

            <div className="mt-4 flex items-center justify-start md:justify-center">
              <a
                href="https://chat.whatsapp.com/your-invite-link"
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col md:flex-row items-center bg-white text-brand-blue p-1 rounded-3xl md:rounded-full shadow-2xl hover:bg-brand-red hover:text-white transition-all duration-500 overflow-hidden"
              >
                <div className="bg-white text-brand-red p-3 md:p-4 rounded-full m-1 transition-colors">
                  <Users size={18} />
                </div>
                <span className="text-base sm:text-lg md:text-2xl font-bold px-4 md:px-8 py-3 md:py-0 break-all md:break-normal">
                  Unirme al grupo
                </span>
                <div className="hidden md:flex bg-brand-blue text-white p-4 rounded-full m-1 transition-colors">
                  <ArrowRight size={20} />
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinWhatsApp;
