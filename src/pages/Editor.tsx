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
  GripVertical
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentBlock {
  id: string;
  type: 'paragraph' | 'image' | 'pdf';
  value: string;
  caption?: string;
}

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (id) {
      fetchPost();
    }
  }, [id, navigate]);

  const fetchPost = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { default: fetchApi } = await import('../lib/api');
      const response = await fetchApi(`/api/posts/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTitle(data.title);
        setBannerImage(data.bannerImage || '');
        setStatus(data.status);
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
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </select>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-brand-blue text-white px-6 py-2 rounded-full font-bold flex items-center space-x-2 hover:bg-brand-red transition-all disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              <span>Guardar</span>
            </button>
          </div>
        </div>

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
        </div>
      </div>
    </div>
  );
};

export default Editor;
