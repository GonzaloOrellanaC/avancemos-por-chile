import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, Reorder } from 'motion/react';
import { 
  Save, Plus, Trash2, ArrowLeft, Loader2, GripVertical, 
  Layout, Type, Image as ImageIcon, Video, Youtube, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Settings, Monitor
} from 'lucide-react';
import { toast } from 'sonner';

const PageEditor = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [pageId, setPageId] = useState('');
  const [title, setTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [isHome, setIsHome] = useState(false);
  const [status, setStatus] = useState('published');
  
  const [hero, setHero] = useState({
    images: [{ url: '', animation: 'zoom' }],
    duration: 6000,
    overlayOpacity: 0.6
  });
  
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (slug && slug !== 'new') {
      fetchPage();
    }
  }, [slug]);

  const fetchPage = async () => {
    setIsLoading(true);
    try {
      const { default: fetchApi } = await import('../lib/api');
      const response = await fetchApi(`/api/pages/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setPageId(data._id);
        setTitle(data.title);
        setPageSlug(data.slug);
        setIsHome(data.isHome);
        setHero(data.hero || hero);
        setSections(data.sections || []);
        setStatus(data.status);
      }
    } catch (error) {
      toast.error('Error al cargar la página');
    } finally {
      setIsLoading(false);
    }
  };

  const addHeroImage = () => {
    setHero({ ...hero, images: [...hero.images, { url: '', animation: 'zoom' }] });
  };

  const updateHeroImage = (index: number, field: string, value: any) => {
    const newImages = [...hero.images];
    newImages[index] = { ...newImages[index], [field]: value };
    setHero({ ...hero, images: newImages });
  };

  const removeHeroImage = (index: number) => {
    setHero({ ...hero, images: hero.images.filter((_, i) => i !== index) });
  };

  const addSection = () => {
    setSections([...sections, {
      id: Date.now().toString(),
      type: 'custom',
      layout: '1',
      columns: [{ content: [] }]
    }]);
  };

  const updateSectionLayout = (index: number, layout: string) => {
    const newSections = [...sections];
    const colCount = parseInt(layout);
    const newCols = Array.from({ length: colCount }, (_, i) => 
      newSections[index].columns[i] || { content: [] }
    );
    newSections[index] = { ...newSections[index], layout, columns: newCols };
    setSections(newSections);
  };

  const addContentToCol = (sIndex: number, cIndex: number, type: string) => {
    const newSections = [...sections];
    newSections[sIndex].columns[cIndex].content.push({
      type,
      value: '',
      align: 'left'
    });
    setSections(newSections);
  };

  const updateContent = (sIndex: number, cIndex: number, coIndex: number, field: string, value: any) => {
    const newSections = [...sections];
    newSections[sIndex].columns[cIndex].content[coIndex][field] = value;
    setSections(newSections);
  };

  const removeContent = (sIndex: number, cIndex: number, coIndex: number) => {
    const newSections = [...sections];
    newSections[sIndex].columns[cIndex].content.splice(coIndex, 1);
    setSections(newSections);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const { default: fetchApi } = await import('../lib/api');
      const response = await fetchApi('/api/pages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: pageId,
          title,
          slug: pageSlug,
          isHome,
          hero,
          sections,
          status
        })
      });
      if (response.ok) {
        toast.success('Página guardada');
        navigate('/profile');
      } else {
        toast.error('Error al guardar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center pt-32"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 sticky top-24 z-40">
          <div className="flex items-center space-x-4">
            <Link to="/profile" className="text-gray-400 hover:text-brand-blue"><ArrowLeft /></Link>
            <h1 className="text-xl font-bold text-brand-blue">Editor de Página</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handleSave} disabled={isSaving} className="bg-brand-blue text-white px-6 py-2 rounded-full font-bold flex items-center space-x-2">
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              <span>Guardar Página</span>
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Configuración Básica */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-brand-blue mb-4 flex items-center gap-2"><Settings size={20}/> Configuración</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Título de la Página" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl outline-none" />
              <input type="text" placeholder="Slug (URL)" value={pageSlug} onChange={e => setPageSlug(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl outline-none" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isHome} onChange={e => setIsHome(e.target.checked)} />
                <span className="font-bold text-brand-blue">Es Página de Inicio</span>
              </label>
            </div>
          </div>

          {/* Hero Editor */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-brand-blue mb-4 flex items-center gap-2"><Monitor size={20}/> Hero Principal</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Duración (ms)</label>
                  <input type="number" value={hero.duration} onChange={e => setHero({...hero, duration: parseInt(e.target.value)})} className="w-full p-2 bg-gray-50 rounded-lg" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Opacidad Overlay</label>
                  <input type="number" step="0.1" min="0" max="1" value={hero.overlayOpacity} onChange={e => setHero({...hero, overlayOpacity: parseFloat(e.target.value)})} className="w-full p-2 bg-gray-50 rounded-lg" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Imágenes del Slider</label>
                {hero.images.map((img, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl">
                    <input type="text" placeholder="URL Imagen" value={img.url} onChange={e => updateHeroImage(idx, 'url', e.target.value)} className="flex-grow p-2 bg-white rounded-lg outline-none" />
                    <select value={img.animation} onChange={e => updateHeroImage(idx, 'animation', e.target.value)} className="p-2 bg-white rounded-lg outline-none">
                      <option value="zoom">Zoom</option>
                      <option value="pan-right">Derecha</option>
                      <option value="pan-left">Izquierda</option>
                    </select>
                    <button onClick={() => removeHeroImage(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                  </div>
                ))}
                <button onClick={addHeroImage} className="text-brand-blue font-bold text-sm flex items-center gap-1"><Plus size={16}/> Añadir Imagen</button>
              </div>
            </div>
          </div>

          {/* Sections Editor */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-brand-blue">Secciones de Contenido</h2>
              <button onClick={addSection} className="bg-brand-red text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 text-sm"><Plus size={18}/> Nueva Fila (Row)</button>
            </div>

            <Reorder.Group axis="y" values={sections} onReorder={setSections} className="space-y-6">
              {sections.map((section, sIdx) => (
                <Reorder.Item key={section.id || sIdx} value={section} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <GripVertical className="text-gray-300 cursor-grab" />
                      <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg">
                        <select 
                          value={section.type} 
                          onChange={e => {
                            const newSections = [...sections];
                            newSections[sIdx].type = e.target.value;
                            setSections(newSections);
                          }}
                          className="text-xs font-bold bg-white p-1 rounded border-none outline-none text-brand-blue"
                        >
                          <option value="custom">Personalizado</option>
                          <option value="cards">Tarjetas (Misión/Visión)</option>
                        </select>
                        <div className="h-4 w-[1px] bg-gray-200 mx-1"></div>
                        {[1,2,3,4].map(n => (
                          <button 
                            key={n}
                            onClick={() => updateSectionLayout(sIdx, n.toString())}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${section.layout === n.toString() ? 'bg-brand-blue text-white' : 'hover:bg-gray-200 text-gray-400'}`}
                          >
                            {n} Col
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => setSections(sections.filter((_, i) => i !== sIdx))} className="text-gray-300 hover:text-red-500"><Trash2 size={20}/></button>
                  </div>

                  <div className={`grid gap-6 grid-cols-1 md:grid-cols-${section.layout}`}>
                    {section.columns.map((col: any, cIdx: number) => (
                      <div key={cIdx} className="bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200">
                        {section.type === 'cards' && (
                          <div className="mb-4 space-y-2">
                            <input 
                              type="text" 
                              placeholder="Título de Tarjeta" 
                              value={col.title || ''} 
                              onChange={e => {
                                const newSections = [...sections];
                                newSections[sIdx].columns[cIdx].title = e.target.value;
                                setSections(newSections);
                              }}
                              className="w-full p-2 text-sm font-bold bg-white rounded border border-gray-100 outline-none"
                            />
                            <select 
                              value={col.icon || ''} 
                              onChange={e => {
                                const newSections = [...sections];
                                newSections[sIdx].columns[cIdx].icon = e.target.value;
                                setSections(newSections);
                              }}
                              className="w-full p-2 text-xs bg-white rounded border border-gray-100 outline-none"
                            >
                              <option value="">Sin Icono</option>
                              <option value="Target">Misión (Blanco)</option>
                              <option value="Eye">Visión (Ojo)</option>
                              <option value="Compass">Objetivo (Brújula)</option>
                            </select>
                          </div>
                        )}
                        <div className="space-y-4">
                          {col.content.map((item: any, coIdx: number) => (
                            <div key={coIdx} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">{item.type}</span>
                                <div className="flex gap-1">
                                  {['left', 'center', 'right', 'justify'].map(a => (
                                    <button key={a} onClick={() => updateContent(sIdx, cIdx, coIdx, 'align', a)} className={`p-1 rounded ${item.align === a ? 'bg-brand-blue/10 text-brand-blue' : 'text-gray-300'}`}>
                                      {a === 'left' && <AlignLeft size={14}/>}
                                      {a === 'center' && <AlignCenter size={14}/>}
                                      {a === 'right' && <AlignRight size={14}/>}
                                      {a === 'justify' && <AlignJustify size={14}/>}
                                    </button>
                                  ))}
                                  <button onClick={() => removeContent(sIdx, cIdx, coIdx)} className="ml-1 text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
                                </div>
                              </div>
                              
                              {['title', 'subtitle', 'text'].includes(item.type) && (
                                <textarea 
                                  value={item.value} 
                                  onChange={e => updateContent(sIdx, cIdx, coIdx, 'value', e.target.value)}
                                  placeholder={`Escribe el ${item.type}...`}
                                  className="w-full text-sm outline-none resize-none bg-transparent"
                                />
                              )}
                              {['image', 'video', 'youtube'].includes(item.type) && (
                                <input 
                                  type="text" 
                                  value={item.value} 
                                  onChange={e => updateContent(sIdx, cIdx, coIdx, 'value', e.target.value)}
                                  placeholder={`URL de ${item.type}...`}
                                  className="w-full text-xs p-1 bg-gray-50 rounded outline-none"
                                />
                              )}
                            </div>
                          ))}
                          
                          <div className="flex flex-wrap gap-2 pt-2">
                            <button onClick={() => addContentToCol(sIdx, cIdx, 'title')} className="p-1.5 bg-white rounded-lg border border-gray-100 text-gray-400 hover:text-brand-blue hover:border-brand-blue transition-all"><Type size={14}/></button>
                            <button onClick={() => addContentToCol(sIdx, cIdx, 'text')} className="p-1.5 bg-white rounded-lg border border-gray-100 text-gray-400 hover:text-brand-blue hover:border-brand-blue transition-all"><Layout size={14}/></button>
                            <button onClick={() => addContentToCol(sIdx, cIdx, 'image')} className="p-1.5 bg-white rounded-lg border border-gray-100 text-gray-400 hover:text-brand-blue hover:border-brand-blue transition-all"><ImageIcon size={14}/></button>
                            <button onClick={() => addContentToCol(sIdx, cIdx, 'youtube')} className="p-1.5 bg-white rounded-lg border border-gray-100 text-gray-400 hover:text-brand-blue hover:border-brand-blue transition-all"><Youtube size={14}/></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageEditor;
