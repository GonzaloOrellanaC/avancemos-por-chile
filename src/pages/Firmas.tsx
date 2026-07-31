import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Loader2, PenLine, Target, CalendarDays, ShieldCheck } from 'lucide-react';

interface Petition {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  bannerImage?: string;
  goal: number;
  signatureCount: number;
  createdAt: string;
  author?: { _id?: string; name: string };
}

interface PetitionCardProps {
  petition: Petition;
  index: number;
}

function PetitionCard({ petition, index }: PetitionCardProps) {
  const progress = petition.goal > 0 ? Math.min(100, Math.round((petition.signatureCount / petition.goal) * 100)) : 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="group flex flex-col rounded-2xl bg-white shadow-lg transition-all hover:shadow-2xl overflow-hidden"
    >
      <Link to={`/firma/${petition.slug}`} className="relative h-52 overflow-hidden block">
        <img
          src={petition.bannerImage || 'https://picsum.photos/seed/petition/800/500'}
          alt={petition.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-black uppercase tracking-wider text-brand-blue">
            <PenLine size={13} className="text-brand-red" />
            <span>Iniciativa de firma</span>
          </div>
        </div>
      </Link>

      <div className="p-6 flex flex-col flex-1">
        <h2 className="text-2xl font-bold text-brand-blue mb-2 line-clamp-2 group-hover:text-brand-red transition-colors">
          <Link to={`/firma/${petition.slug}`}>{petition.title}</Link>
        </h2>
        <p className="text-sm text-gray-500 mb-4 line-clamp-3">
          {petition.summary || 'Firma esta iniciativa para sumar tu apoyo.'}
        </p>

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-1.5 font-bold text-brand-blue">
              <PenLine size={16} className="text-brand-red" />
              {petition.signatureCount.toLocaleString('es-CL')} firmas
            </span>
            {petition.goal > 0 && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-gray-500">
                <Target size={15} />
                Meta: {petition.goal.toLocaleString('es-CL')}
              </span>
            )}
          </div>

          <div className="h-2.5 w-full rounded-full bg-brand-blue/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-red transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <CalendarDays size={14} />
              {new Date(petition.createdAt).toLocaleDateString('es-CL')}
            </span>
            <Link
              to={`/firma/${petition.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-brand-red transition-colors"
            >
              Firmar
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

const Firmas = () => {
  const [items, setItems] = useState<Petition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 9;

  useEffect(() => {
    const fetchPetitions = async () => {
      setIsLoading(true);
      try {
        const { default: fetchApi } = await import('../lib/api');
        const response = await fetchApi(`/api/petitions?page=${page}&limit=${LIMIT}`);
        const data = await response.json();
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error('Error fetching petitions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPetitions();
  }, [page]);

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <header className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-blue/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-brand-blue">
              <PenLine size={14} />
              <span>Participación ciudadana</span>
            </div>
            <h1 className="mt-4 text-4xl md:text-6xl font-black text-brand-blue mb-4">
              FIRMAS DE <span className="text-brand-red">INICIATIVAS</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Apoya las iniciativas que impulsamos. Suma tu firma a los proyectos que crees que merecen avanzar por Chile.
            </p>
            <Link to="/firmas/datos" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue hover:text-brand-red underline transition-colors">
              <ShieldCheck size={16} />
              ¿Cómo usamos tus datos?
            </Link>
          </motion.div>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-brand-blue" size={48} />
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((petition, index) => (
              <PetitionCard key={petition._id} petition={petition} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-gray-500 text-xl">No hay iniciativas abiertas para firmar en este momento.</p>
          </div>
        )}

        {!isLoading && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-4">
            <button
              className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Anterior
            </button>
            <div className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </div>
            <button
              className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Firmas;
