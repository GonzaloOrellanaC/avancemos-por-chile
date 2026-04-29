import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, Reorder } from 'motion/react';
import { 
  Save, 
  Plus, 
  Type, 
  Image as ImageIcon, 
  FileText, 
  Trash2, 
  ArrowLeft,
  Loader2,
  GripVertical,
  MessageSquareQuote,
  History,
  Tags,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentBlock {
  id: string;
  type: 'paragraph' | 'image' | 'pdf';
  value: string;
  caption?: string;
}

type UserRole = 'admin' | 'editor' | 'columnista';
type PostStatus = 'draft' | 'in_review' | 'changes_requested' | 'published';

interface PostHistoryItem {
  _id: string;
  action: 'created' | 'updated' | 'submitted_for_review' | 'changes_requested' | 'resubmitted_for_review' | 'published' | 'moved_to_draft';
  status: PostStatus;
  comment?: string;
  createdAt: string;
  actor?: {
    _id?: string;
    name?: string;
    role?: UserRole;
  };
  actorRole?: UserRole;
}

interface LoadedPost {
  _id: string;
  title: string;
  bannerImage?: string;
  status: PostStatus;
  content: Array<{ type: 'paragraph' | 'image' | 'pdf'; value: string; caption?: string }>;
  tags?: TagOption[];
  history?: PostHistoryItem[];
}

interface TagOption {
  _id?: string;
  name: string;
  slug: string;
  pendingSync?: boolean;
}

interface PendingTagRecord {
  name: string;
  slug: string;
}

const PENDING_TAGS_STORAGE_KEY = 'pending-post-tags';

function isNetworkLikeError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const normalizedMessage = error.message.toLowerCase();
  return error.name === 'TypeError'
    || normalizedMessage.includes('networkerror')
    || normalizedMessage.includes('failed to fetch')
    || normalizedMessage.includes('load failed');
}

function toTagSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const statusOptionsByRole: Record<UserRole, Array<{ value: PostStatus; label: string }>> = {
  admin: [
    { value: 'draft', label: 'Borrador' },
    { value: 'in_review', label: 'En revisión' },
    { value: 'changes_requested', label: 'Solicitar cambios' },
    { value: 'published', label: 'Publicado' },
  ],
  editor: [
    { value: 'draft', label: 'Borrador' },
    { value: 'in_review', label: 'En revisión' },
    { value: 'changes_requested', label: 'Solicitar cambios' },
    { value: 'published', label: 'Publicado' },
  ],
  columnista: [
    { value: 'draft', label: 'Borrador' },
    { value: 'in_review', label: 'Enviar a revisión' },
  ],
};

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('editor');
  
  const [title, setTitle] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [status, setStatus] = useState<PostStatus>('draft');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [history, setHistory] = useState<PostHistoryItem[]>([]);
  const [editorFeedback, setEditorFeedback] = useState('');
  const [originalStatus, setOriginalStatus] = useState<PostStatus>('draft');
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagOption[]>([]);
  const [tagQuery, setTagQuery] = useState('');

  const mergeAvailableTag = (tag: TagOption) => {
    setAvailableTags((current) => {
      const existing = current.find((item) => item.slug === tag.slug);
      if (existing) {
        return current.map((item) => item.slug === tag.slug ? { ...item, ...tag, pendingSync: false } : item);
      }
      return [...current, { ...tag, pendingSync: false }].sort((left, right) => left.name.localeCompare(right.name, 'es'));
    });
  };

  const replaceSelectedTag = (tag: TagOption) => {
    setSelectedTags((current) => current.map((item) => item.slug === tag.slug ? { ...tag, pendingSync: false } : item));
  };

  const readPendingTags = (): PendingTagRecord[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem(PENDING_TAGS_STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writePendingTags = (pendingTags: PendingTagRecord[]) => {
    if (typeof window === 'undefined') return;
    if (!pendingTags.length) {
      window.localStorage.removeItem(PENDING_TAGS_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(PENDING_TAGS_STORAGE_KEY, JSON.stringify(pendingTags));
  };

  const queuePendingTag = (tag: PendingTagRecord) => {
    const pendingTags = readPendingTags();
    if (pendingTags.some((item) => item.slug === tag.slug)) return;
    writePendingTags([...pendingTags, tag]);
  };

  const dequeuePendingTag = (slug: string) => {
    const pendingTags = readPendingTags().filter((item) => item.slug !== slug);
    writePendingTags(pendingTags);
  };

  const upsertTagNow = async (tag: PendingTagRecord) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No autorizado');
    const { default: fetchApi } = await import('../lib/api');
    const response = await fetchApi('/api/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: tag.name }),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errorResult = await response.json().catch(() => ({}));
        throw new Error(errorResult.message || 'No se pudo crear el tag');
      }

      const rawText = await response.text().catch(() => '');
      const cleanedText = rawText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      throw new Error(cleanedText || `Error ${response.status} al crear el tag`);
    }

    const savedTag = await response.json() as TagOption;
    mergeAvailableTag(savedTag);
    replaceSelectedTag(savedTag);
    dequeuePendingTag(savedTag.slug);
    return savedTag;
  };

  const syncPendingTags = async () => {
    const pendingTags = readPendingTags();
    for (const pendingTag of pendingTags) {
      try {
        await upsertTagNow(pendingTag);
      } catch (error) {
        if (!isNetworkLikeError(error)) {
          console.error('Error synchronizing pending tag', error);
        }
        return;
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token) {
      navigate('/login');
      return;
    }

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as { role?: UserRole };
        if (parsedUser.role && parsedUser.role in statusOptionsByRole) {
          setUserRole(parsedUser.role);
        }
      } catch (error) {
        console.warn('Could not read current user role', error);
      }
    }

    fetchTags();
    syncPendingTags();

    const handleOnline = () => {
      syncPendingTags();
    };
    window.addEventListener('online', handleOnline);

    if (id) {
      fetchPost();
    }
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [id, navigate]);

  useEffect(() => {
    const allowedStatuses = statusOptionsByRole[userRole].map((option) => option.value);
    const canKeepCurrentStatus = userRole === 'columnista' && status === 'changes_requested';
    if (!allowedStatuses.includes(status) && !canKeepCurrentStatus) {
      setStatus(allowedStatuses[0]);
    }
  }, [status, userRole]);

  const fetchTags = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const { default: fetchApi } = await import('../lib/api');
      const response = await fetchApi('/api/tags', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const tags = await response.json() as TagOption[];
        setAvailableTags(tags);
      }
    } catch (error) {
      console.error('Error fetching tags', error);
    }
  };

  const fetchPost = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { default: fetchApi } = await import('../lib/api');
      const response = await fetchApi(`/api/posts/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Fetch post response:', response);
      if (response.ok) {
        const data = await response.json() as LoadedPost;
        setTitle(data.title);
        setBannerImage(data.bannerImage || '');
        setStatus(data.status as PostStatus);
        setOriginalStatus(data.status as PostStatus);
        setHistory(data.history || []);
        setSelectedTags(data.tags || []);
        // Add IDs to blocks for Reorder
        setBlocks(data.content.map((b: any, i: number) => ({ ...b, id: `block-${i}-${Date.now()}` })));
      }
    } catch (error) {
      toast.error('Error al cargar la publicación');
    } finally {
      setIsLoading(false);
    }
  };

  const addBlock = (type: 'paragraph' | 'image' | 'pdf') => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      value: '',
      caption: ''
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, value: string, caption?: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, value, caption } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
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
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const { url } = await response.json();
        if (isBanner) {
          setBannerImage(url);
        } else if (blockId) {
          updateBlock(blockId, url, file.name);
        }
        toast.success('Archivo subido correctamente');
      } else {
        try {
          const err = await response.json();
          toast.error(err.message || 'Error al subir archivo');
        } catch (e) {
          toast.error('Error al subir archivo');
        }
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleSave = async () => {
    if (!title) return toast.error('El título es obligatorio');
    if (selectedTags.length > 5) return toast.error('Cada publicación puede tener un máximo de 5 tags');

    if (userRole === 'columnista' && status === 'published') {
      return toast.error('Como columnista solo puedes guardar borradores o enviar a revisión');
    }

    if (userRole === 'columnista' && status === 'changes_requested') {
      return toast.error('Debes corregir el post y luego guardarlo como borrador o reenviarlo a revisión');
    }

    if ((userRole === 'editor' || userRole === 'admin') && status === 'changes_requested' && !editorFeedback.trim()) {
      return toast.error('Agrega comentarios para solicitar cambios');
    }
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = id ? `/api/posts/${id}` : '/api/posts';
      const method = id ? 'PUT' : 'POST';

      const { default: fetchApi } = await import('../lib/api');
      const response = await fetchApi(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          bannerImage,
          status,
          tags: selectedTags.map((tag) => tag.name),
          editorFeedback: status === 'changes_requested' ? editorFeedback : undefined,
          content: blocks.map(({ type, value, caption }) => ({ type, value, caption }))
        })
      });

      if (response.ok) {
        toast.success('Publicación guardada');
        navigate('/profile');
      } else {
        const err = await response.json();
        toast.error(err.message || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-blue" size={48} />
    </div>
  );

  const statusOptions = statusOptionsByRole[userRole];
  const latestFeedback = [...history].reverse().find((entry) => entry.action === 'changes_requested' && entry.comment?.trim());
  const tagSuggestions = availableTags.filter((tag) => {
    const alreadySelected = selectedTags.some((selectedTag) => selectedTag.slug === tag.slug);
    if (alreadySelected) return false;
    if (!tagQuery.trim()) return true;
    return tag.name.toLowerCase().includes(tagQuery.trim().toLowerCase());
  }).slice(0, 8);

  const addTag = (rawValue: string) => {
    const normalizedName = rawValue.trim().replace(/\s+/g, ' ');
    if (!normalizedName) return;
    if (selectedTags.length >= 5) {
      toast.error('Solo puedes asignar hasta 5 tags por publicación');
      return;
    }

    const slug = toTagSlug(normalizedName);
    if (!slug) return;
    if (selectedTags.some((tag) => tag.slug === slug)) {
      setTagQuery('');
      return;
    }

    const existingTag = availableTags.find((tag) => tag.slug === slug);
    const nextTag = existingTag || { name: normalizedName, slug, pendingSync: false };
    setSelectedTags((current) => [...current, nextTag]);
    setTagQuery('');

    if (existingTag) {
      return;
    }

    const pendingTag = { name: normalizedName, slug };
    upsertTagNow(pendingTag).catch((error) => {
      if (isNetworkLikeError(error)) {
        queuePendingTag(pendingTag);
        setAvailableTags((current) => {
          if (current.some((item) => item.slug === slug)) return current;
          return [...current, { ...pendingTag, pendingSync: true }].sort((left, right) => left.name.localeCompare(right.name, 'es'));
        });
        setSelectedTags((current) => current.map((item) => item.slug === slug ? { ...item, pendingSync: true } : item));
        toast.error('No se pudo conectar con el servidor. El tag se guardará automáticamente cuando vuelva la conexión.');
        return;
      }

      setSelectedTags((current) => current.filter((item) => item.slug !== slug));
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el tag');
    });
  };

  const removeTag = (slug: string) => {
    setSelectedTags((current) => current.filter((tag) => tag.slug !== slug));
  };

  const saveLabel = userRole === 'columnista' && status === 'in_review'
    ? originalStatus === 'changes_requested'
      ? 'Reenviar a revisión'
      : 'Enviar a revisión'
    : status === 'changes_requested'
      ? 'Solicitar cambios'
      : status === 'published'
        ? 'Publicar'
        : 'Guardar';

  const actionLabels: Record<PostHistoryItem['action'], string> = {
    created: 'Creó la publicación',
    updated: 'Actualizó el contenido',
    submitted_for_review: 'Envió a revisión',
    changes_requested: 'Solicitó cambios',
    resubmitted_for_review: 'Reenvió a revisión',
    published: 'Publicó la entrada',
    moved_to_draft: 'Volvió a borrador',
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Toolbar */}
        <div className="bg-white p-4 rounded-2xl shadow-md mb-8 flex flex-wrap items-center justify-between sticky top-24 z-30 border border-gray-100">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/profile')}
              className="p-2 text-gray-400 hover:text-brand-blue transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-brand-blue hidden md:block">
              {id ? 'Editar Publicación' : 'Nueva Publicación'}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-brand-blue outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-brand-blue text-white px-6 py-2 rounded-full font-bold flex items-center space-x-2 hover:bg-brand-red transition-all disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              <span>{saveLabel}</span>
            </button>
          </div>
        </div>

        {userRole === 'columnista' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl text-sm">
            Los posts de columnistas pueden quedar como borrador o enviarse a revisión. La publicación final la realiza un editor.
          </div>
        )}

        {latestFeedback && userRole === 'columnista' && (
          <div className="bg-red-50 border border-red-200 text-red-900 px-5 py-4 rounded-2xl text-sm space-y-2">
            <div className="font-black uppercase tracking-wider text-xs">Feedback del editor</div>
            <p className="leading-relaxed whitespace-pre-wrap">{latestFeedback.comment}</p>
            <div className="text-xs text-red-700 font-semibold">
              {latestFeedback.actor?.name || 'Editor'} · {new Date(latestFeedback.createdAt).toLocaleString()}
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="space-y-8">
          {/* Main Info */}
          <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
            <input 
              type="text" 
              placeholder="Título de la publicación"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-4xl font-black text-brand-blue placeholder:text-gray-200 outline-none mb-6"
            />
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider">Imagen de Banner</label>
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <input 
                  type="text" 
                  placeholder="URL de la imagen o sube una..."
                  value={bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                  className="flex-grow bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                />
                <label className="bg-brand-blue/10 text-brand-blue px-6 py-3 rounded-xl font-bold cursor-pointer hover:bg-brand-blue hover:text-white transition-all text-center">
                  Subir Imagen
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, undefined, true)} />
                </label>
              </div>
              {bannerImage && (
                <div className="mt-4 rounded-xl overflow-hidden h-48 border border-gray-100">
                  <img src={bannerImage} alt="Banner Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-brand-blue">
              <Tags size={22} />
              <h2 className="text-xl font-bold">Tags de la publicación</h2>
            </div>
            <p className="text-sm text-gray-500">
              Puedes asociar hasta 5 etiquetas. Si escribes una nueva y no existe, el sistema la creará al guardar. Si ya existe, reutilizará la etiqueta existente.
            </p>

            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <span
                  key={tag.slug}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold ${
                    tag.pendingSync
                      ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
                      : 'bg-brand-blue/10 text-brand-blue'
                  }`}
                >
                  <span>#{tag.name}</span>
                  {tag.pendingSync && (
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                      Pendiente
                    </span>
                  )}
                  <button type="button" onClick={() => removeTag(tag.slug)} className="text-brand-blue/70 hover:text-brand-red">
                    <X size={14} />
                  </button>
                </span>
              ))}
              {selectedTags.length === 0 && <span className="text-sm text-gray-400">No hay tags seleccionados.</span>}
            </div>

            <div className="relative">
              <input
                type="text"
                value={tagQuery}
                onChange={(e) => setTagQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addTag(tagQuery);
                  }
                }}
                placeholder="Escribe un tag y presiona Enter"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-blue"
              />

              {tagSuggestions.length > 0 && tagQuery.trim() && (
                <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
                  {tagSuggestions.map((tag) => (
                    <button
                      key={tag.slug}
                      type="button"
                      onClick={() => addTag(tag.name)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <span className="font-semibold text-brand-blue">#{tag.name}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Existente</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {selectedTags.length}/5 tags seleccionados
            </div>
            {selectedTags.some((tag) => tag.pendingSync) && (
              <div className="text-xs font-semibold text-amber-700">
                Algunos tags están pendientes de sincronización y se guardarán automáticamente cuando vuelva la conexión.
              </div>
            )}
          </div>

          {(userRole === 'editor' || userRole === 'admin') && (
            <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 space-y-4">
              <div className="flex items-center gap-3 text-brand-blue">
                <MessageSquareQuote size={22} />
                <h2 className="text-xl font-bold">Feedback editorial</h2>
              </div>
              <p className="text-sm text-gray-500">
                Usa este espacio cuando necesites rechazar la publicación y devolverla al columnista con observaciones concretas.
              </p>
              <textarea
                value={editorFeedback}
                onChange={(e) => setEditorFeedback(e.target.value)}
                placeholder="Escribe aquí el feedback para el columnista..."
                className="w-full min-h-[140px] rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-blue resize-none"
              />
            </div>
          )}

          {/* Content Blocks */}
          <Reorder.Group axis="y" values={blocks} onReorder={setBlocks} className="space-y-4">
            {blocks.map((block) => (
              <Reorder.Item key={block.id} value={block}>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical className="text-gray-300" />
                  </div>

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-2 text-xs font-black text-gray-300 uppercase tracking-widest">
                      {block.type === 'paragraph' && <Type size={14} />}
                      {block.type === 'image' && <ImageIcon size={14} />}
                      {block.type === 'pdf' && <FileText size={14} />}
                      <span>{block.type}</span>
                    </div>
                    <button 
                      onClick={() => removeBlock(block.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {block.type === 'paragraph' && (
                    <textarea 
                      placeholder="Escribe aquí tu párrafo..."
                      value={block.value}
                      onChange={(e) => updateBlock(block.id, e.target.value)}
                      className="w-full bg-transparent outline-none text-gray-700 leading-relaxed min-h-[100px] resize-none"
                    />
                  )}

                  {block.type === 'image' && (
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                        <input 
                          type="text" 
                          placeholder="URL de la imagen"
                          value={block.value}
                          onChange={(e) => updateBlock(block.id, e.target.value, block.caption)}
                          className="flex-grow bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 outline-none"
                        />
                        <label className="bg-brand-blue/5 text-brand-blue px-4 py-2 rounded-lg font-bold text-sm cursor-pointer hover:bg-brand-blue hover:text-white transition-all text-center">
                          Subir
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, block.id)} />
                        </label>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Pie de foto (opcional)"
                        value={block.caption}
                        onChange={(e) => updateBlock(block.id, block.value, e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 outline-none text-sm"
                      />
                      {block.value && (
                        <div className="mt-2 rounded-lg overflow-hidden max-h-64 border border-gray-100">
                          <img src={block.value} alt="Preview" className="w-full h-full object-contain bg-gray-50" />
                        </div>
                      )}
                    </div>
                  )}

                  {block.type === 'pdf' && (
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                        <input 
                          type="text" 
                          placeholder="URL del documento PDF"
                          value={block.value}
                          onChange={(e) => updateBlock(block.id, e.target.value, block.caption)}
                          className="flex-grow bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 outline-none"
                        />
                        <label className="bg-brand-blue/5 text-brand-blue px-4 py-2 rounded-lg font-bold text-sm cursor-pointer hover:bg-brand-blue hover:text-white transition-all text-center">
                          Subir PDF
                          <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleFileUpload(e, block.id)} />
                        </label>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Nombre del documento"
                        value={block.caption}
                        onChange={(e) => updateBlock(block.id, block.value, e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 outline-none text-sm"
                      />
                      {block.value && (
                        <div className="flex items-center space-x-3 p-4 bg-red-50 text-red-700 rounded-xl">
                          <FileText size={24} />
                          <span className="font-bold">{block.caption || 'Documento PDF'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {/* Add Block Buttons */}
          <div className="flex justify-center space-x-4 py-8">
            <button 
              onClick={() => addBlock('paragraph')}
              className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hover:border-brand-blue hover:text-brand-blue transition-all"
            >
              <Plus size={18} />
              <Type size={18} />
              <span className="font-bold text-sm">Párrafo</span>
            </button>
            <button 
              onClick={() => addBlock('image')}
              className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hover:border-brand-blue hover:text-brand-blue transition-all"
            >
              <Plus size={18} />
              <ImageIcon size={18} />
              <span className="font-bold text-sm">Imagen</span>
            </button>
            <button 
              onClick={() => addBlock('pdf')}
              className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hover:border-brand-blue hover:text-brand-blue transition-all"
            >
              <Plus size={18} />
              <FileText size={18} />
              <span className="font-bold text-sm">PDF</span>
            </button>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
            <div className="flex items-center gap-3 mb-6 text-brand-blue">
              <History size={22} />
              <h2 className="text-xl font-bold">Historial de la publicación</h2>
            </div>

            {history.length === 0 ? (
              <p className="text-gray-400">Aún no hay movimientos registrados.</p>
            ) : (
              <div className="space-y-4">
                {[...history].reverse().map((entry) => (
                  <div key={entry._id} className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-bold text-brand-blue">{actionLabels[entry.action]}</div>
                        <div className="text-sm text-gray-500">
                          {entry.actor?.name || 'Usuario'} · {entry.actor?.role || entry.actorRole || 'sin rol'}
                        </div>
                      </div>
                      <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        {new Date(entry.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {entry.comment && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{entry.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
