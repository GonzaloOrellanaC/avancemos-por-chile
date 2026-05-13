import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const InviteProjects = () => {
  return (
    <div className="mt-8 max-w-4xl mx-auto">
      <div className="rounded-2xl bg-white/5 p-6 text-left md:text-center">
        <h3 className="text-3xl md:text-4xl font-black text-white mb-4">Invitamos el envío de proyectos de ley</h3>
        <p className="text-base md:text-lg text-slate-200 mb-4 max-w-3xl mx-auto leading-relaxed">
          En <strong>Avancemos Por Chile</strong> trabajamos por una política pública orientada al progreso, la transparencia y el bienestar ciudadano. Buscamos
          propuestas técnicas, factibles y con impacto social que aporten a nuestra misión de fortalecer la democracia, promover la prosperidad
          regional y proteger los derechos fundamentales.
        </p>

        <div className="flex justify-center">
          <Link to="/registro-usuario" className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-base md:text-lg font-bold text-brand-blue hover:bg-brand-red hover:text-white transition-colors">
            Inscríbete como Usuario para enviar proyectos
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InviteProjects;
