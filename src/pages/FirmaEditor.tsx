import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Save,
  Plus,
  Type,
  Image as ImageIcon,
  FileText,
  Trash2,
  ArrowLeft,
  Loader2,
  ChevronUp,
  ChevronDown,
  PenLine,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentBlock {
  id: string;
  type: 'paragraph' | 'image' | 'pdf';
  value: string;
  caption?: string;
}

type PetitionStatus = 'draft' | 'published' | 'closed';

interface LoadedPetition {
  _id: string;
  title: string;
  summary?: string;
  bannerImage?: string;
  goal: number;
  status: PetitionStatus;
  content: Array<{ type: 'paragraph' | 'image' | 'pdf'; value: string; caption?: string }>;
}

const STATUS_OPTIONS: Array<{ value: PetitionStatus; label: string }> = [
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Publicada' },
  { value: 'closed', label: 'Cerrada' },
];

const FirmaEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [goal, setGoal] = useState('');
  const [status, setStatus] = useState<PetitionStatus>('draft');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (id) {
      fetchPetition();
    }
  }, [id, navigate]);

  const fetchPetition = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { default: fetchApi } = await import('../lib/api');
      const response = await fetchApi(`/api/petitions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = (await response.json()) as LoadedPetition;
        setTitle(data.title || '');
        setSummary(data.summary || '');
        setBannerImage(data.bannerImage || '');
        setGoal(data.goal > 0 ? String(data.goal) : '');
        setStatus(data.status || 'draft');
        setBlocks(
          (data.content || []).map((block, index) => ({
            ...block,
            id: `block-${index}-${Date.now()}`,
          })),
        );
      } else {
        toast.error('No se pudo cargar la iniciativa');
      }
    } catch (error) {
      toast.error('Error al cargar la iniciativa');
    } finally {
      setIsLoading(false);
    }
  };

  const addBlock = (type: 'paragraph' | 'image' | 'pdf') => {
    const newBlock: ContentBlock = { id: `block-${Date.now()}`, type, value: '', caption: '' };
    setBlocks((current) => [...current, newBlock]);
  };

  const updateBlock = (blockId: string, patch: Partial<ContentBlock>) => {
    setBlocks((current) => current.map((block) => (block.id === blockId ? { ...block, ...patch } : block)));
  };

  const removeBlock = (blockId: string) => {
    setBlocks((current) => current.filter((block) => block.id !== blockId));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    setBlocks((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, blockId?: string, isBanner = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const { default: fetchApi } = await import('../lib/api');
      const response = await fetchApi('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        if (isBanner) {
          setBannerImage(url);
        } else if (blockId) {
          updateBlock(blockId, { value: url, caption: file.name });
        }
        toast.success('Archivo subido correctamente');
      } else {
        toast.error('Error al subir archivo');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = id ? `/api/petitions/${id}` : '/api/petitions';
      const method = id ? 'PUT' : 'POST';

      const { default: fetchApi } = await import('../lib/api');
      const response = await fetchApi(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          summary,
          bannerImage,
          goal: goal ? Number(goal) : 0,
          status,
          content: blocks.map(({ type, value, caption }) => ({ type, value, caption })),
        }),
      });

      if (response.ok) {
        toast.success('Iniciativa guardada correctamente');
        navigate('/admin/firmas');
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.message || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-blue" size={48} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" style={{ marginTop: 75 }}>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => navigate('/admin/firmas')} className="inline-flex items-center space-x-2 text-brand-blue hover:underline">
          <ArrowLeft size={18} />
          <span>Volver a iniciativas</span>
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-6 py-2.5 font-bold text-white hover:bg-brand-red transition-all disabled:opacity-60"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Guardar
        </button>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
        <h1 className="text-3xl font-bold text-brand-blue flex items-center space-x-3 mb-8">
          <PenLine className="text-brand-red" size={32} />
          <span>{id ? 'Editar Iniciativa de Firma' : 'Nueva Iniciativa de Firma'}</span>
        </h1>

        <div className="space-y-6">
          {/* Datos básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-bold text-slate-600">Título de la iniciativa *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: ¡Firma por la educación pública! (los símbolos se quitan del enlace)"
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
              <p className="mt-1 text-xs text-gray-400">
                El enlace se genera automáticamente: espacios → guiones, ñ → n y sin símbolos (ej: /firma/educacion-publica).
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-bold text-slate-600">Resumen (se muestra en la lista de /firmas)</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                placeholder="Resumen breve de la iniciativa"
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-600">Meta de firmas (opcional)</label>
              <div className="relative mt-1">
                <Target size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-red" />
                <input
                  type="number"
                  min="0"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Ej: 5000"
                  className="w-full rounded-xl border border-gray-200 pl-11 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-600">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PetitionStatus)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Banner */}
          <div>
            <label className="text-sm font-bold text-slate-600">Imagen de portada</label>
            {bannerImage && (
              <img src={bannerImage} alt="Portada" className="mt-2 h-40 w-full object-cover rounded-xl" />
            )}
            <div className="mt-2 flex items-center gap-3">
              <input
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                placeholder="URL de la imagen o sube un archivo"
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              />
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-brand-blue px-4 py-2 text-sm font-bold text-brand-blue hover:bg-brand-blue/5 transition-colors">
                <ImageIcon size={16} />
                Subir
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, undefined, true)} />
              </label>
            </div>
          </div>

          {/* Contenido */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-600">Contenido de la iniciativa</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => addBlock('paragraph')} className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3 py-1.5 text-xs font-bold text-brand-blue hover:bg-brand-blue hover:text-white transition-colors">
                  <Type size={14} /> Párrafo
                </button>
                <button type="button" onClick={() => addBlock('image')} className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3 py-1.5 text-xs font-bold text-brand-blue hover:bg-brand-blue hover:text-white transition-colors">
                  <ImageIcon size={14} /> Imagen
                </button>
                <button type="button" onClick={() => addBlock('pdf')} className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3 py-1.5 text-xs font-bold text-brand-blue hover:bg-brand-blue hover:text-white transition-colors">
                  <FileText size={14} /> PDF
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-4">
              {blocks.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-sm text-gray-400">
                  Agrega bloques de contenido (párrafo, imagen o PDF) para esta iniciativa.
                </div>
              )}
              {blocks.map((block, index) => (
                <motion.div
                  key={block.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-blue">
                        {block.type === 'paragraph' ? 'Párrafo' : block.type === 'image' ? 'Imagen' : 'PDF'}
                      </span>
                      <span className="text-xs text-gray-400">#{index + 1}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} className="p-1.5 text-gray-400 hover:text-brand-blue disabled:opacity-30 rounded-lg">
                        <ChevronUp size={18} />
                      </button>
                      <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} className="p-1.5 text-gray-400 hover:text-brand-blue disabled:opacity-30 rounded-lg">
                        <ChevronDown size={18} />
                      </button>
                      <button type="button" onClick={() => removeBlock(block.id)} className="p-1.5 text-gray-400 hover:text-brand-red rounded-lg">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {block.type === 'paragraph' ? (
                    <textarea
                      value={block.value}
                      onChange={(e) => updateBlock(block.id, { value: e.target.value })}
                      rows={4}
                      placeholder="Escribe el párrafo..."
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                    />
                  ) : (
                    <div className="space-y-2">
                      {block.type === 'image' && block.value && (
                        <img src={block.value} alt={block.caption || 'Imagen'} className="max-h-40 rounded-xl object-cover" />
                      )}
                      <div className="flex gap-2">
                        <input
                          value={block.value}
                          onChange={(e) => updateBlock(block.id, { value: e.target.value })}
                          placeholder={block.type === 'image' ? 'URL de la imagen' : 'URL del PDF'}
                          className="flex-1 rounded-xl border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                        />
                        <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-brand-blue px-3 py-2 text-xs font-bold text-brand-blue hover:bg-brand-blue/5 transition-colors">
                          Subir
                          <input
                            type="file"
                            accept={block.type === 'image' ? 'image/*' : '.pdf'}
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, block.id)}
                          />
                        </label>
                      </div>
                      <input
                        value={block.caption || ''}
                        onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                        placeholder={block.type === 'pdf' ? 'Nombre del documento (ej: Texto del proyecto)' : 'Pie de imagen (opcional)'}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Guardar */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
            <button
              onClick={() => navigate('/admin/firmas')}
              className="rounded-full border border-gray-200 px-6 py-2.5 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-8 py-2.5 font-bold text-white hover:bg-brand-red transition-all disabled:opacity-60"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Guardar iniciativa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirmaEditor;
