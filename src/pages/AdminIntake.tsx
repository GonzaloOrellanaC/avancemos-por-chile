import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi as defaultFetch } from '../lib/api';
import type { AuthRequest } from '../middleware/auth';

type Submission = {
  _id: string;
  title: string;
  description?: string;
  submitter?: { _id: string; name?: string; email?: string } | null;
  submitterEmail?: string;
  status: string;
  createdAt: string;
  files?: Array<{ originalName?: string; mimeType?: string; size?: number; storagePath?: string }>;
};

export default function AdminIntake() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const parsed = JSON.parse(stored) as { role?: string };
      if (!(parsed.role === 'admin' || parsed.role === 'project_admin')) {
        navigate('/profile', { replace: true });
        return;
      }
    } catch {
      navigate('/profile', { replace: true });
      return;
    }

    const fetchList = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const { default: fetchApi } = await import('../lib/api');
        const res = await fetchApi('/api/intake?limit=50', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 403) navigate('/profile', { replace: true });
          return;
        }

        const data = await res.json();
        setItems(data.items || data);
      } catch (err) {
        console.error('Error fetching intake list', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchList();
  }, [navigate]);

  const openSubmission = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const { default: fetchApi } = await import('../lib/api');
      const res = await fetchApi(`/api/intake/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      setSelected(data);
    } catch (err) {
      console.error('Error fetching submission', err);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const { default: fetchApi } = await import('../lib/api');
      const res = await fetchApi(`/api/intake/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        console.error('Failed to update status', await res.text());
        return;
      }
      const updated = await res.json();
      setItems((prev) => prev.map((it) => (String(it._id) === String(updated._id) ? updated : it)));
      if (selected && String(selected._id) === String(updated._id)) setSelected(updated);
    } catch (err) {
      console.error('Error updating status', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8" style={{ marginTop: 75 }}>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-black text-brand-blue">Gestión de Recepción de Proyectos</h1>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        {isLoading ? (
          <div className="py-8 text-center text-slate-500">Cargando envíos...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase">
                  <th className="px-3 py-3">Título</th>
                  <th className="px-3 py-3">Remitente</th>
                  <th className="px-3 py-3">Fecha</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((it) => (
                  <tr key={it._id}>
                    <td className="px-3 py-3">
                      <div className="font-bold text-brand-blue line-clamp-1">{it.title}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{it.description}</div>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600">{it.submitter?.name || it.submitterEmail || '—'}</td>
                    <td className="px-3 py-3 text-sm text-slate-600">{new Date(it.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-3 text-sm text-slate-600">{it.status}</td>
                    <td className="px-3 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button className="rounded bg-slate-50 px-3 py-1 text-sm text-brand-blue" onClick={() => openSubmission(it._id)}>Ver</button>
                        <button className="rounded bg-emerald-50 px-3 py-1 text-sm text-emerald-700" onClick={() => updateStatus(it._id, 'approved')}>Aprobar</button>
                        <button className="rounded bg-amber-50 px-3 py-1 text-sm text-amber-700" onClick={() => updateStatus(it._id, 'rejected')}>Rechazar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-500">No hay envíos registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-black/40">
          <div className="max-w-3xl rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-brand-blue">{selected.title}</h2>
                <div className="text-sm text-slate-500">Enviado por: {selected.submitter?.name || selected.submitterEmail}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded bg-slate-50 px-3 py-1 text-sm" onClick={() => setSelected(null)}>Cerrar</button>
              </div>
            </div>

            <div className="mt-4 text-sm text-slate-700">
              <p>{selected.description}</p>
            </div>

            <div className="mt-4 space-y-2">
              {selected.files && selected.files.length ? (
                selected.files.map((f, idx) => (
                  <div key={idx} className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="text-sm font-bold">{f.originalName || f.storagePath}</div>
                    <div className="text-xs text-slate-500">{f.mimeType} • {f.size} bytes</div>
                    {f.storagePath && (
                      <div className="mt-2">
                        <a href={f.storagePath} target="_blank" rel="noreferrer" className="text-brand-blue underline">Descargar</a>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">No hay archivos adjuntos.</div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button className="rounded bg-emerald-50 px-4 py-2 text-emerald-700" onClick={() => { updateStatus(selected._id, 'approved'); setSelected(null); }}>Aprobar</button>
              <button className="rounded bg-amber-50 px-4 py-2 text-amber-700" onClick={() => { updateStatus(selected._id, 'rejected'); setSelected(null); }}>Rechazar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
