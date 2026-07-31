import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, PenLine, Target, CheckCircle2, FileText, Download, User, Mail, MapPin, Fingerprint, AlertCircle } from 'lucide-react';
import { isValidRut, formatRut } from '../lib/rut';

interface ContentBlock {
  type: 'paragraph' | 'image' | 'pdf';
  value: string;
  caption?: string;
}

interface Petition {
  _id: string;
  title: string;
  summary?: string;
  bannerImage?: string;
  content: ContentBlock[];
  goal: number;
  signatureCount: number;
  createdAt: string;
  status: string;
  author?: { _id?: string; name: string };
}

const FirmaDetail = () => {
  const { slug } = useParams();
  const [petition, setPetition] = useState<Petition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bannerAspect, setBannerAspect] = useState<'2/1' | '1/1'>('2/1');

  const [user, setUser] = useState<any | null>(null);
  const [rut, setRut] = useState('');
  const [rutLocked, setRutLocked] = useState(false);
  const [enrolledMissingRut, setEnrolledMissingRut] = useState(false);
  const [profileRutMessage, setProfileRutMessage] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comuna, setComuna] = useState('');
  const [comment, setComment] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSigning, setIsSigning] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    const fetchPetition = async () => {
      setIsLoading(true);
      setFeedback(null);
      try {
        const { default: fetchApi } = await import('../lib/api');
        const response = await fetchApi(`/api/petitions/slug/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setPetition(data);
        } else {
          setPetition(null);
        }
      } catch (error) {
        console.error('Error fetching petition:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPetition();

    // Cargar sesión para el flujo de RUT de usuarios enrolados.
    const loadSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const { default: fetchApi } = await import('../lib/api');
        const res = await fetchApi('/api/auth/validate-token', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const currentUser = data.user;
          setUser(currentUser);
          if (currentUser?.isEnrolled) {
            if (currentUser.rut) {
              setRut(currentUser.rut);
              setRutLocked(true);
            } else {
              setEnrolledMissingRut(true);
            }
          }
        }
      } catch (error) {
        console.error('Error loading session', error);
      }
    };
    loadSession();
  }, [slug]);

  // Detecta la proporción de la foto cargada para ajustarla: 2:1 o 1:1, nunca más alta que ancha.
  useEffect(() => {
    if (!petition?.bannerImage) return;
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      setBannerAspect(ratio >= 1.8 ? '2/1' : '1/1');
    };
    img.onerror = () => setBannerAspect('2/1');
    img.src = petition.bannerImage;
  }, [petition?.bannerImage]);

  const handleRutBlur = () => {
    if (rut && isValidRut(rut)) {
      setRut(formatRut(rut));
    }
  };

  const handleSaveProfileRut = async () => {
    setFormErrors((prev) => ({ ...prev, rut: '' }));
    setProfileRutMessage(null);

    if (!rut.trim()) {
      setFormErrors((prev) => ({ ...prev, rut: 'Debes indicar tu RUT' }));
      return;
    }
    if (!isValidRut(rut)) {
      setFormErrors((prev) => ({ ...prev, rut: 'RUT inválido. Verifica el dígito verificador.' }));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const { default: fetchApi } = await import('../lib/api');
      const res = await fetchApi('/api/auth/me/rut', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rut }),
      });

      if (res.ok) {
        const body = await res.json();
        try {
          const stored = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...stored, rut: body.rut, hasRut: true }));
          window.dispatchEvent(new Event('user-updated'));
        } catch (e) {
          /* ignore */
        }
        setUser((current: any) => (current ? { ...current, rut: body.rut, hasRut: true } : current));
        setRut(formatRut(body.rut));
        setRutLocked(true);
        setEnrolledMissingRut(false);
        setProfileRutMessage('RUT registrado correctamente. Ahora puedes firmar.');
      } else {
        const err = await res.json().catch(() => ({}));
        setProfileRutMessage(err.message || 'No se pudo registrar el RUT');
      }
    } catch (error) {
      setProfileRutMessage('Error de conexión al registrar el RUT');
    }
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setFeedback(null);

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Tu nombre es obligatorio';
    if (!rut.trim()) {
      newErrors.rut = 'Debes indicar tu RUT';
    } else if (!isValidRut(rut)) {
      newErrors.rut = 'RUT inválido. Verifica el dígito verificador.';
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRe.test(email.trim())) {
      newErrors.email = 'Correo inválido';
    }
    if (Object.keys(newErrors).length) {
      setFormErrors(newErrors);
      return;
    }

    if (!petition) return;
    setIsSigning(true);
    try {
      const token = localStorage.getItem('token');
      const { default: fetchApi } = await import('../lib/api');
      const response = await fetchApi(`/api/petitions/${petition._id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          rut,
          email: email.trim() || undefined,
          comuna: comuna.trim() || undefined,
          comment: comment.trim() || undefined,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        setPetition((current) => current ? { ...current, signatureCount: body.signatureCount ?? current.signatureCount + 1 } : current);
        setFeedback({ ok: true, message: body.message || 'Firma registrada correctamente. ¡Gracias por tu apoyo!' });
        // Actualizar el RUT en el perfil local si el servidor lo guardó.
        if (token && rut) {
          try {
            const stored = JSON.parse(localStorage.getItem('user') || '{}');
            if (!stored.rut) {
              localStorage.setItem('user', JSON.stringify({ ...stored, rut, hasRut: true }));
              window.dispatchEvent(new Event('user-updated'));
            }
          } catch (e) {
            /* ignore */
          }
        }
        setName('');
        setEmail('');
        setComuna('');
        setComment('');
        if (!rutLocked) setRut('');
      } else if (response.status === 409) {
        setFeedback({ ok: false, message: body.message || 'Ya existe una firma con este RUT en esta iniciativa' });
      } else {
        setFeedback({ ok: false, message: body.message || 'No se pudo registrar tu firma' });
      }
    } catch (error) {
      setFeedback({ ok: false, message: 'Error de conexión al registrar tu firma' });
    } finally {
      setIsSigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-blue" size={48} />
      </div>
    );
  }

  if (!petition) {
    return (
      <div className="min-h-screen pt-32 text-center">
        <h1 className="text-2xl font-bold text-brand-blue">Iniciativa no encontrada</h1>
        <Link to="/firmas" className="text-brand-red hover:underline mt-4 inline-block">
          Volver a firmas
        </Link>
      </div>
    );
  }

  const progress = petition.goal > 0 ? Math.min(100, Math.round((petition.signatureCount / petition.goal) * 100)) : 0;

  return (
    <div className="min-h-screen pt-24 pb-24 bg-gray-50">
      {/* Banner: foto con opacidad y relieve */}
      <div className="relative h-[100px] w-full overflow-hidden bg-brand-blue/5">
        {petition.bannerImage ? (
          <img
            src={petition.bannerImage}
            alt=""
            className="w-full h-full object-cover opacity-25"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-brand-blue/15 to-brand-red/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-gray-50 shadow-[inset_0_2px_10px_rgba(0,0,0,0.10),inset_0_-2px_10px_rgba(255,255,255,0.55)]" />
      </div>

      <div className="container mx-auto px-4 mt-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            <div className="p-8 md:p-12">
              <Link to="/firmas" className="inline-flex items-center space-x-2 text-gray-400 hover:text-brand-blue transition-colors mb-6 group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold uppercase text-xs tracking-widest">Volver a firmas</span>
              </Link>

              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-blue/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-brand-blue">
                  <PenLine size={14} />
                  <span>Iniciativa de firma</span>
                </div>

                {petition.bannerImage && (
                  <div
                    className={`mt-5 overflow-hidden rounded-xl border border-gray-100 shadow-md ${bannerAspect === '2/1' ? 'w-[200px] aspect-[2/1]' : 'w-[100px] aspect-square'}`}
                  >
                    <img
                      src={petition.bannerImage}
                      alt={petition.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <h1 className="mt-5 text-3xl md:text-5xl font-black text-brand-blue leading-tight">
                  {petition.title}
                </h1>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-brand-blue/5 border border-brand-blue/10 p-6 mb-10">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
                  <span className="inline-flex items-center gap-2 font-bold text-brand-blue">
                    <PenLine size={18} className="text-brand-red" />
                    <span className="text-2xl font-black">{petition.signatureCount.toLocaleString('es-CL')}</span>
                    firmas
                  </span>
                  {petition.goal > 0 && (
                    <span className="inline-flex items-center gap-2 font-semibold text-gray-500">
                      <Target size={18} />
                      Meta: {petition.goal.toLocaleString('es-CL')}
                    </span>
                  )}
                  {petition.author?.name && (
                    <span className="inline-flex items-center gap-2 text-gray-500">
                      <User size={18} />
                      {petition.author.name}
                    </span>
                  )}
                </div>
                <div className="mt-4 h-3 w-full rounded-full bg-white ring-1 ring-brand-blue/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-red transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  {petition.goal > 0
                    ? `${progress}% de la meta de ${petition.goal.toLocaleString('es-CL')} firmas`
                    : 'Suma tu firma a esta iniciativa'}
                </p>
              </div>

              {petition.summary && (
                <p className="text-lg text-gray-700 leading-relaxed mb-8 font-medium">{petition.summary}</p>
              )}

              <div className="space-y-8">
                {petition.content.map((block, index) => (
                  <div key={index}>
                    {block.type === 'paragraph' && (
                      <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{block.value}</p>
                    )}
                    {block.type === 'image' && (
                      <figure className="my-10">
                        <img src={block.value} alt={block.caption || 'Imagen de la iniciativa'} className="w-full rounded-2xl shadow-lg" />
                        {block.caption && (
                          <figcaption className="text-center text-sm text-gray-500 mt-4 italic">{block.caption}</figcaption>
                        )}
                      </figure>
                    )}
                    {block.type === 'pdf' && (
                      <div className="my-8 p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-between group hover:border-brand-blue transition-all">
                        <div className="flex items-center space-x-4">
                          <div className="bg-red-100 p-3 rounded-xl text-red-600">
                            <FileText size={32} />
                          </div>
                          <div>
                            <h4 className="font-bold text-brand-blue">{block.caption || 'Documento Adjunto'}</h4>
                            <p className="text-xs text-gray-400 uppercase font-black">Archivo PDF</p>
                          </div>
                        </div>
                        <a
                          href={block.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-brand-blue text-white p-3 rounded-full hover:bg-brand-red transition-all shadow-lg"
                        >
                          <Download size={24} />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Formulario de firma */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            <div className="p-8 md:p-12">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-brand-blue">
                  <Fingerprint size={14} />
                  <span>Firma validada con RUT</span>
                </div>
                <h2 className="mt-3 text-2xl md:text-3xl font-black text-brand-blue">Firma esta iniciativa</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Para propuestas oficiales, cada persona firma una sola vez con su RUT. Tus datos se tratan de forma segura.
                </p>
              </div>

              {/* Panel: usuario enrolado sin RUT registrado */}
              {enrolledMissingRut && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-amber-800">
                        Como usuario enrolado necesitas registrar tu RUT para firmar.
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        Al guardarlo quedará en tu perfil para futuras firmas y otros servicios.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={rut}
                        onChange={(e) => setRut(e.target.value)}
                        onBlur={handleRutBlur}
                        placeholder="Ej: 12.345.678-9"
                        className={`w-full rounded-xl border px-4 py-2.5 ${formErrors.rut ? 'border-rose-500' : 'border-amber-300'} focus:outline-none focus:ring-2 focus:ring-brand-blue/30`}
                      />
                      {formErrors.rut && <div className="text-sm text-rose-600 mt-1">{formErrors.rut}</div>}
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveProfileRut}
                      className="shrink-0 rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-red transition-colors"
                    >
                      Guardar RUT en mi perfil
                    </button>
                  </div>
                  {profileRutMessage && (
                    <p className={`mt-2 text-sm font-semibold ${profileRutMessage.startsWith('RUT registrado') ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {profileRutMessage}
                    </p>
                  )}
                </div>
              )}

              {feedback && (
                <div className={`mb-6 flex items-start gap-3 rounded-2xl px-5 py-4 text-sm font-semibold ${feedback.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {feedback.ok ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
                  <span>{feedback.message}</span>
                </div>
              )}

              <form onSubmit={handleSign} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <User size={16} /> Nombre completo *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre"
                      className={`mt-1 w-full rounded-xl border px-4 py-2.5 ${formErrors.name ? 'border-rose-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-brand-blue/30`}
                    />
                    {formErrors.name && <div className="text-sm text-rose-600 mt-1">{formErrors.name}</div>}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                      <Fingerprint size={16} /> RUT *
                    </label>
                    <input
                      type="text"
                      value={rut}
                      onChange={(e) => setRut(e.target.value)}
                      onBlur={handleRutBlur}
                      disabled={rutLocked}
                      placeholder="Ej: 12.345.678-9"
                      className={`mt-1 w-full rounded-xl border px-4 py-2.5 ${formErrors.rut ? 'border-rose-500' : 'border-gray-200'} ${rutLocked ? 'bg-slate-50 text-slate-500' : ''} focus:outline-none focus:ring-2 focus:ring-brand-blue/30`}
                    />
                    {formErrors.rut && <div className="text-sm text-rose-600 mt-1">{formErrors.rut}</div>}
                    {rutLocked && (
                      <div className="text-xs text-slate-400 mt-1">
                        RUT de tu cuenta{user?.name ? ` (${user.name})` : ''}. Para cambiarlo usa tu perfil.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    <Mail size={16} /> Correo electrónico (opcional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.cl"
                    className={`mt-1 w-full rounded-xl border px-4 py-2.5 ${formErrors.email ? 'border-rose-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-brand-blue/30`}
                  />
                  {formErrors.email && <div className="text-sm text-rose-600 mt-1">{formErrors.email}</div>}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    <MapPin size={16} /> Comuna o región (opcional)
                  </label>
                  <input
                    type="text"
                    value={comuna}
                    onChange={(e) => setComuna(e.target.value)}
                    placeholder="Ej: Santiago, Región Metropolitana"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-600">Comentario (opcional)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="¿Por qué apoyas esta iniciativa?"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  />
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSigning}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-8 py-3 font-bold text-white hover:bg-brand-red transition-colors disabled:opacity-60"
                  >
                    {isSigning ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Firmando...
                      </>
                    ) : (
                      <>
                        <Fingerprint size={18} />
                        Firmar ahora
                      </>
                    )}
                  </button>
                </div>
                <div className="pt-1 text-center">
                  <Link to="/firmas/datos" className="text-xs text-slate-400 hover:text-brand-blue underline">
                    ¿Cómo usamos tus datos al firmar?
                  </Link>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FirmaDetail;
