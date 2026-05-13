import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function MySubmissions() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const { default: fetchApi } = await import('../lib/api');
        const res = await fetchApi('/api/intake/my', { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 401) {
          // token invalid or missing
          navigate('/login');
          return;
        }
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || 'No se pudo obtener tus envíos');
        }
        const body = await res.json();
        setItems(body.items || []);
      } catch (err: any) {
        setError(err?.message || 'Error al cargar');
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, []);

  const openItem = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const { default: fetchApi } = await import('../lib/api');
      const res = await fetchApi(`/api/intake/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) {
        navigate('/login');
        return;
      }
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'No se pudo obtener el envío');
      }
      const body = await res.json();
      setSelected(body);
    } catch (err: any) {
      setError(err?.message || 'Error al obtener envío');
    }
  };

  return (
    <div className="container mx-auto px-4 py-12" style={{ marginTop: 75 }}>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} aria-label="Atrás" className="text-brand-blue p-1 rounded hover:bg-gray-50">
              <ChevronLeft size={18} />
            </button>
            <h1 className="text-2xl font-black text-brand-blue">Mis envíos</h1>
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-1">Aquí verás los proyectos que has enviado y su estado.</p>

        {loading && <div className="mt-6 text-sm">Cargando...</div>}
        {error && <div className="mt-6 text-sm text-rose-600">{error}</div>}

        {!loading && !items.length && (
          <div className="mt-6 text-sm text-slate-600">No tienes envíos registrados.</div>
        )}

        {!loading && items.length > 0 && (
          <div className="mt-6 space-y-3">
            {items.map((it) => (
              <div key={it._id} className="p-3 border rounded flex items-center justify-between">
                <div>
                  <div className="font-semibold text-brand-blue">{it.title}</div>
                  <div className="text-sm text-slate-500">{new Date(it.createdAt).toLocaleString()} · {it.status}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openItem(it._id)} className="px-3 py-1 rounded bg-brand-blue text-white text-sm">Ver</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
            <div className="relative max-w-3xl w-full bg-white rounded-lg p-6 shadow-lg z-10">
              <h3 className="text-lg font-bold mb-2">{selected.title}</h3>
              <div className="text-sm text-slate-600 mb-3">Enviado: {selected.submitterName || selected.submitter?.name || '—'} · {new Date(selected.createdAt).toLocaleString()}</div>
              <div className="space-y-2 text-sm">
                <div><strong>Estado:</strong> {selected.status}</div>
                <div><strong>Descripción:</strong><div className="mt-1 p-2 bg-slate-50 rounded">{selected.description}</div></div>
                {selected.files && selected.files.length > 0 && (
                  <div>
                    <strong>Archivos:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {selected.files.map((f: any, i: number) => (
                        <li key={i}><a href={f.storagePath} target="_blank" rel="noopener noreferrer" className="text-brand-blue underline">{f.originalName || f.filename}</a></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => setSelected(null)} className="px-3 py-2 rounded border">Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
