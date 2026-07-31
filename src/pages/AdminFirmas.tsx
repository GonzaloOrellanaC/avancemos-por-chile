import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PenLine, Plus, Edit, Trash2, Loader2, ArrowLeft, Users } from 'lucide-react';

interface Petition {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  status: 'draft' | 'published' | 'closed';
  goal: number;
  signatureCount: number;
  createdAt: string;
  author?: { _id?: string; name: string };
}

function getStatusBadge(status: string) {
  if (status === 'published') return 'bg-emerald-100 text-emerald-700';
  if (status === 'closed') return 'bg-slate-200 text-slate-600';
  return 'bg-amber-100 text-amber-700';
}

function getStatusLabel(status: string) {
  if (status === 'published') return 'Publicada';
  if (status === 'closed') return 'Cerrada';
  return 'Borrador';
}

export default function AdminFirmas() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Petition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPetitions = async () => {
      try {
        const token = localStorage.getItem('token');
        const { default: fetchApi } = await import('../lib/api');
        const res = await fetchApi('/api/petitions/manage', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const body = await res.json();
          setItems(body.items || []);
        }
      } catch (err) {
        console.error('Error fetching petitions', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPetitions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta iniciativa? Se perderán también sus firmas.')) return;
    try {
      const token = localStorage.getItem('token');
      const { default: fetchApi } = await import('../lib/api');
      const response = await fetchApi(`/api/petitions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setItems(items.filter((item) => item._id !== id));
      }
    } catch (error) {
      console.error('Error deleting petition', error);
    }
  };


  return (
    <div className="container mx-auto px-4 py-8" style={{ marginTop: 75 }}>
      <div className="mb-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center space-x-2 text-brand-blue hover:underline">
          <ArrowLeft size={18} />
          <span>Atrás</span>
        </button>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-brand-blue flex items-center space-x-3">
            <PenLine className="text-brand-red" size={32} />
            <span>Iniciativas de Firma</span>
          </h1>
          <Link to="/admin/firmas/editor" className="bg-brand-blue text-white px-6 py-3 rounded-full font-bold flex items-center space-x-2 hover:bg-brand-red transition-all shadow-lg">
            <Plus size={20} />
            <span>Nueva Iniciativa</span>
          </Link>
        </div>

        <p className="text-sm text-slate-500 mb-6">
          Administra las iniciativas que se muestran en <Link to="/firmas" className="text-brand-blue underline">/firmas</Link>. Cada iniciativa publicada queda disponible para recolectar firmas en /firma/&lt;título&gt;.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-brand-blue" size={32} />
          </div>
        ) : items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Título</th>
                  <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Estado</th>
                  <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Firmas</th>
                  <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Meta</th>
                  <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item._id} className="group">
                    <td className="py-4 pr-4">
                      <div className="font-bold text-brand-blue">{item.title}</div>
                      <div className="text-xs text-gray-400">/firma/{item.slug}</div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${getStatusBadge(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="py-4 font-black text-brand-blue">{item.signatureCount.toLocaleString('es-CL')}</td>
                    <td className="py-4 text-sm text-gray-500">{item.goal > 0 ? item.goal.toLocaleString('es-CL') : '—'}</td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end space-x-1">
                        <Link
                          to={`/admin/firmas/${item._id}`}
                          title="Ver firmas y reporte PDF"
                          className="p-2 text-gray-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-all"
                        >
                          <Users size={18} />
                        </Link>
                        <Link
                          to={`/admin/firmas/editor/${item._id}`}
                          title="Editar"
                          className="p-2 text-gray-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-all"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(item._id)}
                          title="Eliminar"
                          className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 mb-4">No hay iniciativas de firma creadas.</p>
            <Link to="/admin/firmas/editor" className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-5 py-2 text-sm font-bold text-white hover:bg-brand-red transition-colors">
              <Plus size={16} />
              Crear la primera
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
