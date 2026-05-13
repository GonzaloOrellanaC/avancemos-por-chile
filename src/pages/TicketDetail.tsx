import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { FileText, Upload, X } from 'lucide-react';

export default function TicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<any | null>(null);
  const [reply, setReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyFiles, setReplyFiles] = useState<File[]>([]);

  const fetchTicket = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('No encontrado');
      setTicket(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchTicket(); }, [id]);

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })();

  const isSubmitter = currentUser && ticket && (String(currentUser.id) === String(ticket.submitter?._id) || currentUser.email === ticket.submitter?.email);

  const anyAdminReplyExists = ticket && ticket.replies && ticket.replies.some((r:any) => r.author?.role === 'admin');
  const currentUserHasReplied = currentUser && ticket && ticket.replies && ticket.replies.some((r:any) => {
    const authorId = r.author?._id || r.author?.id;
    return authorId && String(authorId) === String(currentUser.id);
  });

  // Admins can always reply (unless ticket closed). Users can reply only after an admin reply.
  const canReplyAdmin = currentUser && currentUser.role === 'admin' && ticket?.status !== 'closed';
  const canReplyUser = currentUser && isSubmitter && anyAdminReplyExists && ticket?.status !== 'closed';
  const canReply = Boolean(canReplyAdmin || canReplyUser);

  const handleReplyFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    const incoming = Array.from(list);
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const allowedIncoming = incoming.filter(f => ALLOWED.includes(f.type));
    const rejected = incoming.filter(f => !ALLOWED.includes(f.type));
    if (rejected.length > 0) {
      toast.error(`Tipo de archivo no permitido: ${rejected.map(f => f.name).join(', ')}. Tipos permitidos: JPG, PNG, WEBP, PDF`);
    }
    const combined = [...replyFiles, ...allowedIncoming].slice(0, 3);
    setReplyFiles(combined);
  };

  const removeReplyFile = (index: number) => setReplyFiles(prev => prev.filter((_, i) => i !== index));

  const uploadReplyFiles = async () => {
    const uploaded: any[] = [];
    if (!replyFiles.length) return uploaded;
    for (const f of replyFiles) {
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

  const handleReply = async () => {
    try {
      setIsSubmitting(true);
      const uploaded = await uploadReplyFiles();
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tickets/${id}/reply`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ body: reply, files: uploaded })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'Error');
      toast.success('Respuesta enviada');
      setReply('');
      setReplyFiles([]);
      fetchTicket();
    } catch (err: any) {
      toast.error(err.message || 'Error al responder');
    } finally { setIsSubmitting(false); }
  };

  const handleClose = async () => {
    try {
      if ((!reply || !reply.trim()) && replyFiles.length === 0) {
        toast.error('Debes incluir una respuesta o archivos para cerrar el ticket');
        return;
      }
      setIsSubmitting(true);
      const uploaded = await uploadReplyFiles();
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tickets/${id}/close`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ body: reply, files: uploaded })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'Error al cerrar ticket');
      toast.success('Ticket cerrado');
      setReply('');
      setReplyFiles([]);
      fetchTicket();
    } catch (err: any) {
      toast.error(err.message || 'Error al cerrar ticket');
    } finally { setIsSubmitting(false); }
  };

  if (!ticket) return <div className="container mx-auto px-4 py-12">Cargando...</div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6">
        <div style={{height: 50, width: '100%'}} />
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-black">{ticket.ticketId} — {ticket.title}</h1>
            <p className="text-sm text-gray-600">{ticket.submitter?.email} • {new Date(ticket.createdAt).toLocaleString()}</p>
          </div>
          <div>
            {ticket.status === 'closed' ? (
              <span className="text-sm inline-flex items-center px-3 py-1 rounded-full bg-rose-100 text-rose-700">Cerrado</span>
            ) : (
              <span className="text-sm inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700">Abierto</span>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-bold">Descripción</h3>
          <p className="mt-2 text-sm">{ticket.description}</p>
          {ticket.files && ticket.files.length > 0 && (
            <div className="mt-3">
              <h4 className="font-semibold">Archivos adjuntos</h4>
              <ul className="mt-2 space-y-2">
                {ticket.files.map((f:any, i:number) => (
                  <li key={i} className="flex items-center gap-3">
                    <FileText className="text-gray-500" />
                    <a href={f.storagePath} target="_blank" rel="noreferrer" className="text-brand-blue underline">{f.originalName}</a>
                    <span className="text-xs text-gray-400">{f.mimeType} • {Math.round((f.size||0)/1024)} KB</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h3 className="font-bold">Respuestas</h3>
          <div className="space-y-3 mt-3">
            {ticket.replies && ticket.replies.length ? ticket.replies.map((r:any, i:number) => (
              <div key={i} className="p-3 border rounded">
                <div className="text-sm font-semibold">{r.author?.name || 'Usuario'}</div>
                <div className="text-sm text-gray-700 mt-1">{r.body}</div>
                {r.files && r.files.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-semibold text-sm">Archivos adjuntos</h4>
                    <ul className="mt-2 space-y-1">
                      {r.files.map((f:any, idx:number) => (
                        <li key={idx} className="flex items-center gap-3 text-sm">
                          <FileText className="text-gray-500" />
                          <a href={f.storagePath} target="_blank" rel="noreferrer" className="text-brand-blue underline">{f.originalName}</a>
                          <span className="text-xs text-gray-400">{f.mimeType} • {Math.round((f.size||0)/1024)} KB</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )) : <p className="text-sm text-gray-500">Sin respuestas</p>}
          </div>
        </div>

        {canReply ? (
          <div>
            <div className="flex items-center justify-end mb-2">
              
            </div>
            {!currentUser && <p className="text-sm text-gray-500 mb-3">Debes iniciar sesión para responder.</p>}
            {currentUser && isSubmitter && !anyAdminReplyExists && <p className="text-sm text-gray-500 mb-3">Aún no hay respuesta del equipo; espera a que un administrador responda para poder contestar.</p>}

            <textarea placeholder="Respuesta" value={reply} onChange={(e)=>setReply(e.target.value)} className="w-full rounded border px-3 py-2 mb-3" rows={4} />

            <div className="mb-3">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <Upload />
                <span className="text-sm">Adjuntar archivos (máx 3) — Tipos permitidos: JPG, PNG, WEBP, PDF</span>
                <input type="file" multiple onChange={handleReplyFiles} className="hidden" />
              </label>

              {replyFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {replyFiles.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 rounded p-2">
                      <div className="text-sm text-gray-700">{f.name} <span className="text-xs text-gray-400">({Math.round(f.size/1024)} KB)</span></div>
                      <button type="button" onClick={() => removeReplyFile(idx)} className="text-rose-600 hover:text-rose-800 p-1 rounded">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button disabled={!canReply || isSubmitting} onClick={handleReply} className="bg-brand-blue text-white px-4 py-2 rounded">{isSubmitting ? 'Enviando...' : 'Responder'}</button>
                {canReplyAdmin && ticket.status !== 'closed' && (
                <button type="button" disabled={( !reply || !reply.trim()) && replyFiles.length === 0 || isSubmitting} onClick={handleClose} className="ml-2 px-3 py-1 rounded bg-rose-600 text-white">Cerrar ticket</button>
              )}
            </div>
          </div>
        ) : null }
      </div>
    </div>
  );
}
