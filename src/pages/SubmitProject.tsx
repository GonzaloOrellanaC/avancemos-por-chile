import React, { useEffect, useState, useRef } from 'react';
import InputWithIcon from '../components/InputWithIcon';
import { User, Mail, Phone, MapPin, FileText, Lightbulb, Users, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type UploadResult = { url: string };

export default function SubmitProject() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultSuccess, setResultSuccess] = useState(false);
  const [resultMessage, setResultMessage] = useState<string>('');

  // Section 1 - Datos básicos
  const [fullName, setFullName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [comuna, setComuna] = useState('');
  const [participates, setParticipates] = useState<'no'|'si'>('no');
  const [participationOrg, setParticipationOrg] = useState('');

  // Section 2 - Identificación Idea
  const [itemType, setItemType] = useState<'problema'|'idea'|'propuesta'>('idea');
  const AREA_OPTIONS = [
    'Seguridad','Salud','Educación','Deporte','Cultura','Medioambiente','Emprendimiento','Adulto Mayor','Juventud','Infancia','Discapacidad','Mujer','Transporte','Espacios Públicos','Vivienda','Participación Ciudadana','Tecnología','Otro','No sé exactamente'
  ];
  const [areas, setAreas] = useState<string[]>([]);
  const [otherArea, setOtherArea] = useState('');
  const [briefDescription, setBriefDescription] = useState('');
  const [problemToSolve, setProblemToSolve] = useState('');
  const [mainBeneficiaries, setMainBeneficiaries] = useState('');

  // Section 3 & 4 - Justification
  const [whyImportant, setWhyImportant] = useState('');
  const [currentSituation, setCurrentSituation] = useState('');
  const [seenElsewhere, setSeenElsewhere] = useState<'no'|'si'>('no');
  const [seenWhere, setSeenWhere] = useState('');
  const [consequencesNotAddressed, setConsequencesNotAddressed] = useState('');
  const [ideaSuggestions, setIdeaSuggestions] = useState('');

  // Section 5 - Participación Activa
  const [wantsToParticipate, setWantsToParticipate] = useState<'no'|'si'>('no');
  const [joinWorkingGroup, setJoinWorkingGroup] = useState<'no'|'si'>('no');
  const [canContribute, setCanContribute] = useState('');
  const [allowContact, setAllowContact] = useState<'no'|'si'>('si');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [allowPublish, setAllowPublish] = useState<'no'|'si'>('no');
  const [otherIdeas, setOtherIdeas] = useState('');

  // Advanced (optional)
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [estimatedBeneficiaries, setEstimatedBeneficiaries] = useState('');
  const [implementationActions, setImplementationActions] = useState('');
  const [approxCost, setApproxCost] = useState<'bajo'|'medio'|'alto'|'no-se'|''>('');
  const [urgency, setUrgency] = useState<'Baja'|'Media – Baja'|'Media'|'Media – Alta'|'Alta'|'Urgente' | ''>('');
  const [viability, setViability] = useState<'Poco viable'|'Medianamente viable'|'Viable'|'Muy Viable' | ''>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true, state: { from: '/cargar-nuevo-proyecto' } });
      return;
    }

    const validate = async () => {
      try {
        const { default: fetchApi } = await import('../lib/api');
        const res = await fetchApi('/api/auth/validate-token', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          navigate('/login', { replace: true, state: { from: '/cargar-nuevo-proyecto' } });
          return;
        }
        const data = await res.json();
        setUser(data.user || null);
        if (!data.user?.isEnrolled) {
          setMessage('Tu cuenta aún no ha sido activada. Revisa tu correo electrónico que debe contener un link para activar la cuenta y poder cargar una nueva propuesta.');
        }
      } catch (err) {
        console.error('Error validating session', err);
        navigate('/login', { replace: true, state: { from: '/cargar-nuevo-proyecto' } });
      }
    };

    validate();
  }, [navigate]);

  // prefill fields from authenticated user but allow edits
  useEffect(() => {
    if (!user) return;
    if (user.name) setFullName(prev => prev || user.name);
    if (user.email) setContactEmail(prev => prev || user.email);
    if (user.phone) setContactPhone(prev => prev || user.phone);
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    const arr = Array.from(list).filter(f => validateFile(f));
    setFiles(prev => [...prev, ...arr]);
  };

  const performSubmit = async () => {
    if (!pendingPayload) return;
    setIsSubmitting(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const uploadedFiles: Array<any> = [];
      if (files && files.length) {
        for (const f of files) {
          const up = await uploadFile(f);
          uploadedFiles.push({ originalName: f.name, mimeType: f.type, size: f.size, storagePath: up.url });
        }
      }

      const { default: fetchApi } = await import('../lib/api');
      const payloadToSend = { ...pendingPayload, files: uploadedFiles, submitterName: pendingPayload.form?.personal?.fullName };
      const res = await fetchApi('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payloadToSend),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Error en el envío');
      }
      const body = await res.json();
      // show result modal with success
      setResultSuccess(true);
      setResultMessage(body?.message || 'Envío recibido');
      setShowResultModal(true);
      setTitle('');
      setDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFiles([]);
      setPendingPayload(null);
      setShowConfirmModal(false);
      // redirect after 3s
      setTimeout(() => {
        navigate('/mis-envios');
      }, 3000);
    } catch (err: any) {
      console.error('Submit error', err);
      const text = typeof err === 'string' ? err : err.message || 'Error al enviar';
      setResultSuccess(false);
      setResultMessage(text);
      setShowResultModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateFile = (f: File) => {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(f.type)) return true;
    // fallback by extension for files that may have empty/incorrect mime
    const name = f.name.toLowerCase();
    return name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.docx');
  };

  const humanLabel = (key: string) => {
    const map: Record<string,string> = {
      fullName: 'Nombre completo',
      contactEmail: 'Correo',
      contactPhone: 'Teléfono',
      comuna: 'Comuna',
      participates: 'Participa en organización',
      participationOrg: 'Organización',
      itemType: 'Tipo',
      areas: 'Áreas',
      briefDescription: 'Descripción breve',
      problemToSolve: 'Problema a resolver',
      mainBeneficiaries: 'Beneficiarios',
      whyImportant: 'Por qué es importante',
      currentSituation: 'Situación actual',
      seenElsewhere: 'Visto en otro lugar',
      seenWhere: 'Dónde',
      consequencesNotAddressed: 'Consecuencias de no abordar',
      ideaSuggestions: 'Sugerencias',
      wantsToParticipate: 'Desea participar',
      joinWorkingGroup: 'Integrar mesa de trabajo',
      canContribute: 'Aportes / contactos',
      allowContact: 'Autoriza contacto',
      additionalInfo: 'Antecedentes adicionales',
      allowPublish: 'Autoriza publicación',
      otherIdeas: 'Otras ideas',
      estimatedBeneficiaries: 'Grupo beneficiado',
      implementationActions: 'Acciones para implementación',
      approxCost: 'Costo estimado',
      urgency: 'Urgencia',
      viability: 'Viabilidad'
    };
    return map[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
  };

  const hasData = (v: any): boolean => {
    if (v == null) return false;
    if (typeof v === 'string') return v.trim() !== '';
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return Object.values(v).some(hasData);
    return true;
  };

  const renderSummary = (form: any) => {
    const sectionsOrder = ['personal','identification','justification','participation','advanced'];
    return (
      <div>
        {sectionsOrder.map((sectionKey) => {
          const section = form[sectionKey];
          if (!section) return null;
          const entries = Object.entries(section).filter(([k,v]) => hasData(v));
          if (!entries.length) return null;
          return (
            <div key={sectionKey} className="mb-3">
              <div className="font-semibold text-sm mb-1">{humanLabel(sectionKey)}</div>
              <div className="space-y-1 text-sm">
                {entries.map(([k,v]) => {
                  if (!hasData(v)) return null;
                  let display = '';
                  if (Array.isArray(v)) display = v.join(', ');
                  else if (typeof v === 'object') {
                    const nested = Object.entries(v).filter(([nk,nv]) => hasData(nv));
                    display = nested.map(([nk,nv]) => `${humanLabel(nk)}: ${Array.isArray(nv) ? nv.join(', ') : String(nv)}`).join(' · ');
                  } else display = String(v);
                  return (
                    <div key={k} className="flex gap-2">
                      <div className="text-slate-600 w-48">{humanLabel(k)}:</div>
                      <div className="flex-1 break-words">{display}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const removeFileAt = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    // revoke preview URL for removed file if exists
    if (previews[index]) {
      try { URL.revokeObjectURL(previews[index]); } catch (e) { /* ignore */ }
      setPreviews(prev => prev.filter((_, i) => i !== index));
    }
    if (selectedPreviewIndex === index) setSelectedPreviewIndex(null);
  };

  const onDropFiles = (d: DataTransfer) => {
    const list = Array.from(d.files || []);
    const arr = list.filter(f => validateFile(f));
    if (arr.length) setFiles(prev => [...prev, ...arr]);
    setIsDragActive(false);
  };

  // build preview URLs for selected files and clean up on change/unmount
  useEffect(() => {
    // revoke old previews
    previews.forEach((p) => {
      try { URL.revokeObjectURL(p); } catch (e) { /* ignore */ }
    });
    const next = files.map((f) => URL.createObjectURL(f));
    setPreviews(next);
    if (selectedPreviewIndex !== null && (selectedPreviewIndex < 0 || selectedPreviewIndex >= next.length)) {
      setSelectedPreviewIndex(null);
    }
    return () => {
      next.forEach((p) => {
        try { URL.revokeObjectURL(p); } catch (e) { /* ignore */ }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const toggleArea = (area: string) => {
    setAreas((prev) => (prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]));
  };

  const uploadFile = async (file: File): Promise<UploadResult> => {
    const token = localStorage.getItem('token');
    const { default: fetchApi } = await import('../lib/api');
    const form = new FormData();
    form.append('file', file);
    const res = await fetchApi('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    } as any);
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!user?.isEnrolled) {
      setMessage('No estás autorizado a enviar proyectos.');
      return;
    }
    // validate required fields
    const newErrors: Record<string,string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Nombre completo es obligatorio';
    if (!contactEmail.trim()) newErrors.contactEmail = 'Correo electrónico es obligatorio';
    // email format
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (contactEmail && !emailRe.test(contactEmail)) newErrors.contactEmail = 'Correo inválido';
    if (!contactPhone.trim()) newErrors.contactPhone = 'Teléfono es obligatorio';
    const digitCount = contactPhone.replace(/\D/g,'').length;
    if (contactPhone && digitCount < 7) newErrors.contactPhone = 'Teléfono inválido';
    // at least one area or 'No sé exactamente'
    if (!areas || areas.length === 0) newErrors.areas = 'Selecciona al menos un área o marca "No sé exactamente"';
    if (!briefDescription.trim()) newErrors.briefDescription = 'Descripción breve es obligatoria';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      setMessage('Faltan datos obligatorios. Revisa los campos resaltados.');
      return;
    }

    setErrors({});
    // prepare payload and open confirm modal instead of sending directly
    const payload = {
      title: title || (briefDescription ? briefDescription.slice(0, 120) : 'Banco de Ideas'),
      description: description || briefDescription,
      files: [], // files will be uploaded on confirm
      form: {
        personal: { fullName, contactEmail, contactPhone, comuna, participates, participationOrg },
        identification: { itemType, areas: areas.concat(areas.includes('Otro') ? [otherArea] : []), briefDescription, problemToSolve, mainBeneficiaries },
        justification: { whyImportant, currentSituation, seenElsewhere, seenWhere, consequencesNotAddressed, ideaSuggestions },
        participation: { wantsToParticipate, joinWorkingGroup, canContribute, allowContact, additionalInfo, allowPublish, otherIdeas },
        advanced: { estimatedBeneficiaries, implementationActions, approxCost, urgency, viability },
      }
    };

    setPendingPayload(payload);
    setShowConfirmModal(true);
  };

  if (message && user?.isEnrolled === false) {
    return (
      <div className="container mx-auto px-4 py-12" style={{ marginTop: 75 }}>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-brand-blue">Acceso restringido</h2>
          <p className="mt-3 text-slate-600">{message}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-12" style={{ marginTop: 75 }}>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Atrás" className="text-brand-blue p-1 rounded hover:bg-gray-50">
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-2xl font-black text-brand-blue flex items-center gap-3"><Lightbulb className="w-6 h-6 text-brand-blue" />Formulario Banco de Ideas</h1>
        </div>
        <p className="mt-2 text-sm text-slate-500">Comparte tu idea, problema o propuesta. Solo usuarios enrolados pueden enviar. Adjunta documentos si corresponde.</p>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          {/* Section 1 - Datos básicos */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold">Sección 1 — Datos básicos</h2>
            <div>
              <InputWithIcon label="Nombre completo" icon={User} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" className={errors.fullName ? 'border-rose-500' : ''} />
              {errors.fullName && <div className="text-sm text-rose-600 mt-1">{errors.fullName}</div>}
            </div>
            <div>
              <InputWithIcon label="Correo electrónico" icon={Mail} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="tu@correo.cl" className={errors.contactEmail ? 'border-rose-500' : ''} />
              {errors.contactEmail && <div className="text-sm text-rose-600 mt-1">{errors.contactEmail}</div>}
            </div>
            <div>
              <InputWithIcon label="Teléfono de contacto" icon={Phone} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+56 9 ..." className={errors.contactPhone ? 'border-rose-500' : ''} />
                {errors.contactPhone && <div className="text-sm text-rose-600 mt-1">{errors.contactPhone}</div>}
            </div>
            <div>
              <InputWithIcon label="Comuna donde reside" icon={MapPin} value={comuna} onChange={(e) => setComuna(e.target.value)} placeholder="Comuna" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600">¿Participa en alguna organización?</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2"><input type="radio" name="participa" checked={participates==='si'} onChange={() => setParticipates('si')} /> Sí</label>
                <label className="flex items-center gap-2"><input type="radio" name="participa" checked={participates==='no'} onChange={() => setParticipates('no')} /> No</label>
              </div>
              {participates === 'si' && (
                <div className="mt-2">
                  <label className="text-sm font-bold text-slate-600">En caso afirmativo, puede indicar cuál (opcional)</label>
                  <InputWithIcon icon={FileText} value={participationOrg} onChange={(e) => setParticipationOrg(e.target.value)} placeholder="Nombre de la organización" />
                </div>
              )}
          </div>
        </div>

          {/* Section 2 - Identificación Idea */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold">Sección 2 — Identificación Idea</h2>
            <div>
              <label className="text-sm font-bold text-slate-600">Indique si es</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2"><input type="radio" name="itemType" checked={itemType==='problema'} onChange={() => setItemType('problema')} /> Problema</label>
                <label className="flex items-center gap-2"><input type="radio" name="itemType" checked={itemType==='idea'} onChange={() => setItemType('idea')} /> Idea</label>
                <label className="flex items-center gap-2"><input type="radio" name="itemType" checked={itemType==='propuesta'} onChange={() => setItemType('propuesta')} /> Propuesta</label>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-600">En qué área se enmarca (puede seleccionar varias)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {AREA_OPTIONS.map((a) => (
                  <label key={a} className="flex items-center gap-2"><input type="checkbox" checked={areas.includes(a)} onChange={() => toggleArea(a)} /> {a}</label>
                ))}
              </div>
              {areas.includes('Otro') && (
                <div className="mt-2">
                  <input placeholder="Indique otro" value={otherArea} onChange={(e) => setOtherArea(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                </div>
              )}
              {errors.areas && <div className="text-sm text-rose-600 mt-1">{errors.areas}</div>}
            </div>

            <div>
              <InputWithIcon label="Describa brevemente" icon={Lightbulb} textarea value={briefDescription} onChange={(e) => setBriefDescription(e.target.value)} className={errors.briefDescription ? 'border-rose-500' : ''} />
              {errors.briefDescription && <div className="text-sm text-rose-600 mt-1">{errors.briefDescription}</div>}
            </div>

            <div>
              <label className="text-sm font-bold text-slate-600">(Si es propuesta o idea) ¿Qué problema busca resolver?</label>
              <textarea value={problemToSolve} onChange={(e) => setProblemToSolve(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" rows={3} />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-600">¿A quiénes beneficiaría principalmente?</label>
              <input value={mainBeneficiaries} onChange={(e) => setMainBeneficiaries(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
            </div>
          </div>

          {/* Section 3/4 - Justificación */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold">Sección 3/4 — Justificación</h2>
            <div>
              <label className="text-sm font-bold text-slate-600">¿Por qué considera importante implementar esta idea/propuesta?</label>
              <textarea value={whyImportant} onChange={(e) => setWhyImportant(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" rows={4} />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600">¿Qué situación actual motiva esta idea/propuesta?</label>
              <textarea value={currentSituation} onChange={(e) => setCurrentSituation(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" rows={3} />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600">¿Ha visto esta idea/propuesta aplicada en otro lugar?</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2"><input type="radio" name="seenElsewhere" checked={seenElsewhere==='si'} onChange={() => setSeenElsewhere('si')} /> Sí</label>
                <label className="flex items-center gap-2"><input type="radio" name="seenElsewhere" checked={seenElsewhere==='no'} onChange={() => setSeenElsewhere('no')} /> No</label>
              </div>
              {seenElsewhere === 'si' && (
                <div className="mt-2">
                  <input placeholder="Dónde y resultados" value={seenWhere} onChange={(e) => setSeenWhere(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600">¿Qué consecuencias tendría no abordar este problema?</label>
              <textarea value={consequencesNotAddressed} onChange={(e) => setConsequencesNotAddressed(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" rows={3} />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600">¿Tiene alguna idea o propuesta para resolver este problema?</label>
              <textarea value={ideaSuggestions} onChange={(e) => setIdeaSuggestions(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" rows={3} />
            </div>
          </div>

          {/* Section 5 - Participación Activa */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold">Sección 5 — Participación activa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-slate-600">¿Le gustaría participar en el desarrollo?</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2"><input type="radio" checked={wantsToParticipate==='si'} onChange={() => setWantsToParticipate('si')} /> Sí</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={wantsToParticipate==='no'} onChange={() => setWantsToParticipate('no')} /> No</label>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-600">¿Estaría dispuesto/a a integrar una mesa de trabajo?</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2"><input type="radio" checked={joinWorkingGroup==='si'} onChange={() => setJoinWorkingGroup('si')} /> Sí</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={joinWorkingGroup==='no'} onChange={() => setJoinWorkingGroup('no')} /> No</label>
                </div>
              </div>
            </div>
            <div>
              <InputWithIcon label="¿Puede aportar contactos, experiencia, voluntarios o apoyo técnico?" icon={Users} textarea value={canContribute} onChange={(e) => setCanContribute(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600">¿Autoriza que nos contactemos con usted?</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2"><input type="radio" checked={allowContact==='si'} onChange={() => setAllowContact('si')} /> Sí</label>
                <label className="flex items-center gap-2"><input type="radio" checked={allowContact==='no'} onChange={() => setAllowContact('no')} /> No</label>
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600">¿Desea agregar algún antecedente adicional?</label>
              <textarea value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" rows={3} />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600">¿Autoriza que publiquemos esta propuesta?</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2"><input type="radio" checked={allowPublish==='si'} onChange={() => setAllowPublish('si')} /> Sí</label>
                <label className="flex items-center gap-2"><input type="radio" checked={allowPublish==='no'} onChange={() => setAllowPublish('no')} /> No</label>
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600">¿Tiene otra idea, comentario o sugerencia?</label>
              <textarea value={otherIdeas} onChange={(e) => setOtherIdeas(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" rows={3} />
            </div>
          </div>

          {/* Section 6 - Archivos y cierre */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold">Sección 6 — Cierre y archivos</h2>
                <div>
                  <label className="text-sm font-bold text-slate-600">Archivos (solo PDF o Word)</label>
                  <div
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDropFiles(e.dataTransfer); setIsDragActive(false); }}
                    className={`mt-2 rounded border-dashed border-2 p-4 text-center ${files.length ? 'bg-slate-50' : ''} ${isDragActive ? 'border-brand-blue bg-slate-50 shadow-inner' : ''}`}
                  >
                    <input ref={fileInputRef} id="project-files" type="file" accept=".pdf,.doc,.docx,application/msword,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple onChange={handleFileChange} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded bg-brand-blue px-4 py-2 text-white">Seleccionar archivos</button>
                    <div className="mt-2 text-sm text-slate-600">O arrastra aquí tus archivos (.pdf, .doc, .docx)</div>
                    {files.length === 0 && <div className="mt-2 text-sm text-slate-500">Ningún archivo seleccionado</div>}
                    {files.length > 0 && (
                      <div className="mt-3 text-left">
                        <ul className="space-y-1">
                          {files.map((f, idx) => (
                            <li key={f.name + idx} className="flex items-center justify-between gap-3">
                              <button type="button" onClick={() => setSelectedPreviewIndex(idx)} className="text-left truncate">
                                {f.name} <span className="text-xs text-slate-400">({Math.round(f.size/1024)} KB)</span>
                              </button>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => setSelectedPreviewIndex(idx)} className="text-sm text-brand-blue">Ver</button>
                                <button type="button" onClick={() => removeFileAt(idx)} className="text-sm text-rose-600">Eliminar</button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedPreviewIndex !== null && previews[selectedPreviewIndex] && (
                      <div className="mt-4 border rounded p-3 bg-white">
                        <h4 className="font-semibold mb-2">Visor</h4>
                        {(() => {
                          const f = files[selectedPreviewIndex];
                          const url = previews[selectedPreviewIndex];
                          const isPdf = f && (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
                          if (isPdf) {
                            return <embed src={url} type="application/pdf" width="100%" height={500} />;
                          }
                          return (
                            <div className="space-y-2">
                              <div className="text-sm text-slate-600">Vista previa no disponible para este tipo de archivo. No te preocupes — el archivo está listo para cargarse y se subirá correctamente.</div>
                              <div>
                                <a className="text-sm text-brand-blue underline" href={url} target="_blank" rel="noopener noreferrer">Abrir en nueva pestaña / descargar</a>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
            <div className="text-sm text-slate-600">Gracias por compartir tu idea. Tu participación es importante.</div>
          </div>

          {/* Advanced optional */}
          <div>
            <button type="button" onClick={() => setAdvancedOpen(v => !v)} className="text-sm text-brand-blue underline">{advancedOpen ? 'Ocultar sección avanzada' : 'Mostrar sección avanzada (opcional)'}</button>
            {advancedOpen && (
              <div className="mt-4 space-y-2">
                <h3 className="font-bold">Formulario Avanzado (opcional)</h3>
                <div>
                  <label className="text-sm font-bold text-slate-600">¿Qué grupo sería más beneficiado?</label>
                  <input value={estimatedBeneficiaries} onChange={(e) => setEstimatedBeneficiaries(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600">Acciones para implementación</label>
                  <textarea value={implementationActions} onChange={(e) => setImplementationActions(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" rows={3} />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600">Costo estimado</label>
                  <select value={approxCost} onChange={(e) => setApproxCost(e.target.value as any)} className="mt-1 w-full rounded border px-3 py-2">
                    <option value="">--</option>
                    <option value="bajo">Bajo</option>
                    <option value="medio">Medio</option>
                    <option value="alto">Alto</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600">Urgencia</label>
                  <select value={urgency} onChange={(e) => setUrgency(e.target.value as any)} className="mt-1 w-full rounded border px-3 py-2">
                    <option value="">--</option>
                    <option>Baja</option>
                    <option>Media – Baja</option>
                    <option>Media</option>
                    <option>Media – Alta</option>
                    <option>Alta</option>
                    <option>Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600">Viabilidad</label>
                  <select value={viability} onChange={(e) => setViability(e.target.value as any)} className="mt-1 w-full rounded border px-3 py-2">
                    <option value="">--</option>
                    <option>Poco viable</option>
                    <option>Medianamente viable</option>
                    <option>Viable</option>
                    <option>Muy Viable</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {message && <div className="text-sm text-rose-600">{message}</div>}

          <div className="flex items-center gap-3">
            <input id="acceptPrivacy" type="checkbox" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} className="w-4 h-4" />
            <label htmlFor="acceptPrivacy" className="text-sm text-slate-700">He leído y acepto nuestras <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-blue underline">políticas de privacidad</a></label>
          </div>

          <div>
            <button
              disabled={isSubmitting || !acceptedPrivacy}
              type="submit"
              title={!acceptedPrivacy ? 'Debes aceptar las políticas de privacidad' : undefined}
              className={`rounded px-4 py-2 text-white ${isSubmitting || !acceptedPrivacy ? 'bg-brand-blue/40 cursor-not-allowed' : 'bg-brand-blue hover:brightness-105'}`}
            >
              {isSubmitting ? 'Enviando...' : 'Ver resumen para enviar'}
            </button>
          </div>
        </form>
        {showConfirmModal && pendingPayload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfirmModal(false)} />
            <div className="relative max-w-3xl w-full bg-white rounded-lg p-6 shadow-lg z-10">
              <h3 className="text-lg font-bold mb-3">Resumen antes de enviar</h3>
              <div className="max-h-80 overflow-auto space-y-3 text-sm">
                {renderSummary(pendingPayload.form)}
                {files && files.length > 0 && (
                  <div>
                    <strong>Archivos seleccionados:</strong>
                    <ul className="mt-1 list-disc list-inside">
                      {files.map((f, i) => <li key={f.name + i}>{f.name}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowConfirmModal(false)} className="px-3 py-2 rounded border">Cancelar</button>
                <button type="button" onClick={performSubmit} disabled={isSubmitting} className="px-4 py-2 rounded bg-brand-blue text-white">{isSubmitting ? 'Enviando...' : 'Enviar proyecto'}</button>
              </div>
            </div>
          </div>
        )}
        {showResultModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowResultModal(false)} />
            <div className="relative max-w-md w-full bg-white rounded-lg p-6 shadow-lg z-10">
              <h3 className="text-lg font-bold mb-2">{resultSuccess ? 'Envío exitoso' : 'Error al enviar'}</h3>
              <div className={`p-3 rounded ${resultSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{resultMessage}</div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => setShowResultModal(false)} className="px-3 py-2 rounded border">Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
