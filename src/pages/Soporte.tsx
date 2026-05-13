import React, { useEffect, useState } from 'react';
import fetchApi from '../lib/api';
import ticketService from '../lib/ticketService';
import { Plus, FileText, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface Ticket {
  _id: string;
  ticketId: string;
  title: string;
  description: string;
  submitterEmail?: string;
  createdAt: string;
  status?: string;
}

export default function Soporte() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const { default: fetchApi } = await import('../lib/api');
      const res = await fetchApi('/api/tickets/my', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Error');
      setTickets(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    const incoming = Array.from(list);
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const allowedIncoming = incoming.filter(f => ALLOWED.includes(f.type));
    const rejected = incoming.filter(f => !ALLOWED.includes(f.type));
    if (rejected.length > 0) {
      toast.error(`Tipo de archivo no permitido: ${rejected.map(f => f.name).join(', ')}. Tipos permitidos: JPG, PNG, WEBP, PDF`);
    }

    // append allowed files but cap at 3
    const combined = [...files, ...allowedIncoming].slice(0, 3);
    setFiles(combined);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    const uploaded: any[] = [];
    if (!files.length) return uploaded;
    for (const f of files) {
      const form = new FormData();
      form.append('file', f);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload', { method: 'POST', body: form, headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'Upload failed');
      uploaded.push({ originalName: f.name, storagePath: json.url, mimeType: f.type, size: f.size });
    }
    return uploaded;
  };

  const handleCreate = async () => {
    try {
      setIsSubmitting(true);
      const ticketId = await ticketService.getNewTicketId();
      const uploaded = await uploadFiles();
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ticketId, title, description: body, files: uploaded }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error');
      toast.success('Ticket creado');
      setShowNew(false);
      setTitle(''); setBody(''); setFiles([]);
      fetchTickets();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al crear ticket');
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6">
            <div style={{height: 50, width: '100%'}} />
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black">Soporte técnico</h1>
          <button onClick={() => setShowNew(s => !s)} className="inline-flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-lg">
            <Plus size={16} /> Nuevo ticket
          </button>
        </div>

        {showNew && (
          <div className="mb-6">
            <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Título" className="w-full mb-3 rounded border px-3 py-2" />
            <textarea value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Describe el problema" className="w-full mb-3 rounded border px-3 py-2" rows={5} />
            <div className="mb-3">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <Upload />
                <span className="text-sm">Adjuntar archivos (máx 3) — Tipos permitidos: JPG, PNG, WEBP, PDF</span>
                <input type="file" multiple onChange={handleFile} className="hidden" />
              </label>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 rounded p-2">
                      <div className="text-sm text-gray-700">{f.name} <span className="text-xs text-gray-400">({Math.round(f.size/1024)} KB)</span></div>
                      <button type="button" onClick={() => removeFile(idx)} className="text-rose-600 hover:text-rose-800 p-1 rounded">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button disabled={isSubmitting} onClick={handleCreate} className="bg-brand-red text-white px-4 py-2 rounded font-bold">{isSubmitting ? 'Enviando...' : 'Enviar'}</button>
              <button onClick={() => setShowNew(false)} className="px-4 py-2 rounded border">Cancelar</button>
            </div>
          </div>
        )}

        <div>
          {isLoading ? <p>Cargando...</p> : (
            tickets.length ? (
              <ul className="space-y-3">
                {tickets.map(t => {
                  const last = (t as any).replies?.length ? (t as any).replies[(t as any).replies.length - 1] : null;
                  let name: string | null = null;
                  if (last && last.author) {
                    const a = last.author as any;
                    name = (a.name || '').trim();
                  }
                  return (
                    <li key={t._id} className="p-4 border rounded flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="font-bold">{t.ticketId} — {t.title}</div>
                          <div>
                            {t.status === 'closed' ? (
                              <span className="text-xs inline-flex items-center px-2 py-1 rounded-full bg-rose-100 text-rose-700">Cerrado</span>
                            ) : (
                              <span className="text-xs inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700">Abierto</span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">{t.submitterEmail} • {new Date(t.createdAt).toLocaleString()}</div>
                        {name && <div className="text-sm text-gray-600 mt-1">Última respuesta: {name}</div>}
                      </div>
                      <div>
                        <a href={`/soporte/${t.ticketId}`} className="text-brand-blue font-bold">Ver</a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : <p>No hay tickets</p>
          )}
        </div>
      </div>
    </div>
  );
}
