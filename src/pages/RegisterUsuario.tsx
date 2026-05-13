import React, { useState } from 'react';
import InputWithIcon from '../components/InputWithIcon';
import { User, Mail, Lock, FileText, Phone, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RegisterUsuario() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [enrollmentNotes, setEnrollmentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // RUT helpers (kept inside component so they can access state setters)
  function isValidRut(raw: string) {
    if (!raw) return false;
    const rut = String(raw).replace(/\./g, '').replace(/-/g, '').toUpperCase().trim();
    if (rut.length < 2) return false;
    const body = rut.slice(0, -1);
    const dv = rut.slice(-1);
    if (!/^[0-9]+$/.test(body)) return false;

    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body.charAt(i), 10) * multiplier;
      multiplier = multiplier < 7 ? multiplier + 1 : 2;
    }

    const remainder = sum % 11;
    const checkDigit = 11 - remainder;
    let expected = '';
    if (checkDigit === 11) expected = '0';
    else if (checkDigit === 10) expected = 'K';
    else expected = String(checkDigit);

    return expected === dv;
  }

  function formatRutInput(raw: string) {
    if (!raw) return '';
    // keep only digits and K/k
    const cleaned = String(raw).replace(/[^0-9kK]/g, '').toUpperCase();
    if (cleaned.length === 0) return '';
    if (cleaned.length === 1) return cleaned;

    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);

    // format body with dots from right
    let reversed = body.split('').reverse();
    const groups: string[] = [];
    for (let i = 0; i < reversed.length; i += 3) {
      groups.push(reversed.slice(i, i + 3).reverse().join(''));
    }
    const formattedBody = groups.reverse().join('.');

    return `${formattedBody}-${dv}`;
  }

  function handleDocumentChange(value: string) {
    // allow pasting of formatted or raw RUT
    const formatted = formatRutInput(value);
    setDocumentId(formatted);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!name || !email || !password) {
      setMessage('Completa nombre, correo y contraseña');
      return;
    }

    // validate RUT if provided
    if (documentId && !isValidRut(documentId)) {
      setMessage('RUT inválido. Verifica el número de identificación.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { default: fetchApi } = await import('../lib/api');
      const res = await fetchApi('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, documentId, phone, organization, enrollmentNotes }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMessage(body.message || 'Error al registrarse');
        return;
      }

      setMessage(body.message || 'Registro correcto. Revisa tu correo.');
      // optional redirect to login
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Register error', err);
      setMessage('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12" style={{ marginTop: 75 }}>
      <div className="max-w-2xl mx-auto rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-brand-blue flex items-center gap-3"><User className="w-6 h-6 text-brand-blue" />Registro de Usuario</h1>
        <p className="mt-2 text-sm text-slate-500">Regístrate como `Usuario` para solicitar enrolamiento y poder enviar proyectos.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <InputWithIcon label="Nombre completo" icon={User} value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
          </div>

          <div>
            <InputWithIcon label="Correo" icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.cl" />
          </div>

          <div>
            <InputWithIcon label="Contraseña" icon={Lock} value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Contraseña" />
          </div>

          <div>
            <InputWithIcon label="Documento (RUT/DNI)" icon={FileText} value={documentId} onChange={(e) => handleDocumentChange(e.target.value)} inputMode="text" placeholder="12.345.678-5" />
          </div>

          <div>
            <InputWithIcon label="Teléfono" icon={Phone} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+56 9 ..." />
          </div>

          <div>
            <InputWithIcon label="Organización (opcional)" icon={Building} value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Nombre de la organización" />
          </div>

          <div className="mt-2">
            <p className="text-sm text-slate-500 mb-4">
              Tipos de proyectos que esperamos recibir: propuestas de política pública en educación, salud, desarrollo regional, reformas económicas
              responsables, iniciativas de transparencia y anticorrupción, medidas de protección social y ambiental, y proyectos que fomenten la
              participación ciudadana. Prioritizamos ideas con evidencia, análisis de impacto y una hoja de ruta clara para su implementación.
            </p>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-600">Notas / motivo de enrolamiento</label>
            <textarea value={enrollmentNotes} onChange={(e) => setEnrollmentNotes(e.target.value)} className="mt-1 w-full rounded border px-3 py-2" rows={4} />
          </div>

          {message && <div className="text-sm text-rose-600">{message}</div>}

          <div>
            <button disabled={isSubmitting} type="submit" className="rounded bg-brand-blue px-4 py-2 text-white">{isSubmitting ? 'Registrando...' : 'Registrarme'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
