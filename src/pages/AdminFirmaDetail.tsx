import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, PenLine, Target, Download, Users, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import { formatRut } from '../lib/rut';
import { downloadPetitionReportPdf } from '../lib/petitionPdf';

interface Petition {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  goal: number;
  signatureCount: number;
  status: 'draft' | 'published' | 'closed';
  createdAt: string;
}

interface SignatureItem {
  _id?: string;
  name: string;
  rut: string;
  email?: string;
  comuna?: string;
  comment?: string;
  createdAt: string;
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

export default function AdminFirmaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [petition, setPetition] = useState<Petition | null>(null);
  const [signatures, setSignatures] = useState<SignatureItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const { default: fetchApi } = await import('../lib/api');
        const [petitionRes, signaturesRes] = await Promise.all([
          fetchApi(`/api/petitions/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetchApi(`/api/petitions/${id}/signatures`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (petitionRes.ok) {
          const petitionData = await petitionRes.json();
          setPetition(petitionData);
        }

        if (signaturesRes.ok) {
          const body = await signaturesRes.json();
          setSignatures(Array.isArray(body.signatures) ? body.signatures : []);
        }
      } catch (error) {
        console.error('Error fetching petition detail', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!petition) return;
    setIsDownloading(true);
    try {
      await downloadPetitionReportPdf(petition, signatures);
      toast.success('Reporte PDF generado');
    } catch (error) {
      console.error('Error generating PDF', error);
      toast.error('No se pudo generar el reporte PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8" style={{ marginTop: 75 }}>
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand-blue" size={40} />
        </div>
      </div>
    );
  }

  if (!petition) {
    return (
      <div className="container mx-auto px-4 py-8" style={{ marginTop: 75 }}>
        <div className="bg-white p-8 rounded-2xl shadow-md text-center">
          <p className="text-gray-500">Iniciativa no encontrada.</p>
          <button onClick={() => navigate('/admin/firmas')} className="mt-4 text-brand-blue hover:underline">
            Volver a iniciativas
          </button>
        </div>
      </div>
    );
  }

  const progress = petition.goal > 0 ? Math.min(100, Math.round((petition.signatureCount / petition.goal) * 100)) : 0;

  return (
    <div className="container mx-auto px-4 py-8" style={{ marginTop: 75 }}>
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <button onClick={() => navigate('/admin/firmas')} className="inline-flex items-center space-x-2 text-brand-blue hover:underline">
          <ArrowLeft size={18} />
          <span>Volver a iniciativas</span>
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-red transition-all disabled:opacity-60"
        >
          {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          Descargar reporte PDF
        </button>
      </div>

      <div className="space-y-6">
        {/* Encabezado de la iniciativa */}
        <section className="bg-white rounded-3xl shadow-md border border-gray-100 p-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-blue/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-brand-blue">
              <PenLine size={14} />
              <span>Iniciativa de firma</span>
            </span>
            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${getStatusBadge(petition.status)}`}>
              {getStatusLabel(petition.status)}
            </span>
          </div>
          <h1 className="text-3xl font-black text-brand-blue leading-tight">{petition.title}</h1>
          {petition.summary && <p className="mt-3 text-gray-600">{petition.summary}</p>}
          <p className="mt-2 text-xs text-gray-400">/firma/{petition.slug}</p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-brand-blue/5 px-5 py-4 ring-1 ring-brand-blue/10">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                <Users size={14} className="text-brand-red" />
                <span>Firmas</span>
              </div>
              <div className="mt-2 text-3xl font-black text-brand-blue">
                {petition.signatureCount.toLocaleString('es-CL')}
              </div>
            </div>
            <div className="rounded-2xl bg-brand-red/5 px-5 py-4 ring-1 ring-brand-red/10">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                <Target size={14} className="text-brand-red" />
                <span>Meta</span>
              </div>
              <div className="mt-2 text-3xl font-black text-brand-blue">
                {petition.goal > 0 ? petition.goal.toLocaleString('es-CL') : '—'}
              </div>
            </div>
            <div className="rounded-2xl bg-brand-blue/5 px-5 py-4 ring-1 ring-brand-blue/10">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Avance</div>
              <div className="mt-2 text-3xl font-black text-brand-red">{progress}%</div>
            </div>
          </div>
          <div className="mt-4 h-3 w-full rounded-full bg-brand-blue/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-red transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        {/* Tabla de firmas */}
        <section className="bg-white rounded-3xl shadow-md border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-brand-blue flex items-center gap-2">
              <Users className="text-brand-red" size={22} />
              Firmas registradas
            </h2>
            <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-bold text-brand-blue">
              {signatures.length.toLocaleString('es-CL')}
            </span>
          </div>

          {signatures.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">N°</th>
                    <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Nombre</th>
                    <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">RUT</th>
                    <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Correo</th>
                    <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Comuna</th>
                    <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {signatures.map((signature, index) => (
                    <tr key={signature._id || index} className="group">
                      <td className="py-4 text-sm text-gray-400">{index + 1}</td>
                      <td className="py-4 font-bold text-brand-blue">{signature.name}</td>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                          <Fingerprint size={14} className="text-brand-red" />
                          {formatRut(signature.rut)}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-500">{signature.email || '—'}</td>
                      <td className="py-4 text-sm text-gray-500">{signature.comuna || '—'}</td>
                      <td className="py-4 text-sm text-gray-500">
                        {new Date(signature.createdAt).toLocaleDateString('es-CL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400">Aún no hay firmas para esta iniciativa.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
