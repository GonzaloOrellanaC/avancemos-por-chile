import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Activate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const token = searchParams.get('token') || '';
      if (!token) {
        toast.error('Token de activación faltante');
        setLoading(false);
        return;
      }

      try {
        const apiBase = (import.meta as any).env?.VITE_API_BASE || '';
        const base = apiBase.replace(/\/$/, '');
        const activationUrl = base ? `${base}/api/auth/activate?token=${encodeURIComponent(token)}` : `/api/auth/activate?token=${encodeURIComponent(token)}`;

        const res = await fetch(activationUrl, { headers: { Accept: 'application/json' }, redirect: 'follow' });

        if (!res.ok) {
          const json = await res.json().catch(() => null);
          const msg = json?.message || `Error activando cuenta (${res.status})`;
          toast.error(msg);
          setLoading(false);
          return;
        }

        // Prefer JSON response from backend
        const json = await res.json().catch(() => null);
        if (json && json.success) {
          toast.success('Cuenta activada correctamente');
          setTimeout(() => navigate('/login?activated=1'), 1000);
          return;
        }

        // Fallback: redirect to login
        navigate('/login?activated=1');
      } catch (err) {
        console.error(err);
        toast.error('Error al activar cuenta');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-brand-blue/10 bg-white px-5 py-3 text-sm font-semibold text-brand-blue shadow-sm">
          <Loader2 size={18} className="animate-spin text-brand-red" />
          <span>Activando cuenta…</span>
        </div>
        {!loading && (
          <div className="mt-4 text-sm text-gray-600">Si no ves redirección, <a href="/login" className="text-brand-blue">ir a iniciar sesión</a></div>
        )}
      </div>
    </div>
  );
}
