import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Plus, Edit, Trash2, Loader2, ArrowLeft } from 'lucide-react';

interface Page {
  _id: string;
  title: string;
  slug: string;
  isHome: boolean;
  status: string;
  createdAt: string;
}

export default function AdminPages() {
  const navigate = useNavigate();
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const token = localStorage.getItem('token');
        const { default: fetchApi } = await import('../lib/api');
        const res = await fetchApi('/api/pages', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setPages(await res.json());
      } catch (err) {
        console.error('Error fetching pages', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPages();
  }, []);

  const handleDeletePage = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta página?')) return;
    try {
      const token = localStorage.getItem('token');
      const { default: fetchApi } = await import('../lib/api');
      const response = await fetchApi(`/api/pages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) setPages(pages.filter(p => p._id !== id));
    } catch (error) {
      console.error('Error deleting page', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8" style={{marginTop: 75}}>
      <div className="mb-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center space-x-2 text-brand-blue hover:underline">
          <ArrowLeft size={18} />
          <span>Atrás</span>
        </button>
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-brand-blue flex items-center space-x-3">
            <Layout className="text-brand-red" size={32} />
            <span>Páginas del Sitio</span>
          </h1>
          <Link to="/page-editor/new" className="bg-brand-red text-white px-6 py-3 rounded-full font-bold flex items-center space-x-2 hover:bg-brand-blue transition-all shadow-lg">
            <Plus size={20} />
            <span>Nueva Página</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-brand-blue" size={32} /></div>
        ) : pages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Título</th>
                  <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Slug</th>
                  <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pages.map((page) => (
                  <tr key={page._id} className="group">
                    <td className="py-4 font-bold text-brand-blue">
                      {page.title} {page.isHome && <span className="ml-2 text-[10px] bg-brand-blue text-white px-2 py-0.5 rounded-full">INICIO</span>}
                    </td>
                    <td className="py-4 text-sm text-gray-500">/{page.slug}</td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Link to={`/page-editor/${page.slug}`} className="p-2 text-gray-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-all"><Edit size={18} /></Link>
                        {!page.isHome && <button onClick={() => handleDeletePage(page._id)} className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 mb-4">No hay páginas dinámicas creadas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
