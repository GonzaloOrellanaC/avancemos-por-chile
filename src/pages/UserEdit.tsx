import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Nota: Este perfil es el que se mostrará en la página pública del editor ("Columnista").

export default function UserEdit() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [isPublicProfile, setIsPublicProfile] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const load = async () => {
      const stored = localStorage.getItem('user');
      if (!stored) return navigate('/login');
      const me = JSON.parse(stored);
      try {
        const token = localStorage.getItem('token');
        const { default: fetchApi } = await import('../lib/api');
        const res = await fetchApi(`/api/auth/users/${me.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setProfileImage(data.profileImage || '');
          setShortDescription(data.shortDescription || '');
          setLongDescription(data.longDescription || '');
          setIsPublicProfile(!!data.isPublicProfile);
          setName(data.name || '');
          setEmail(data.email || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [navigate]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try {
      const token = localStorage.getItem('token');
      const { default: fetchApi } = await import('../lib/api');
      const res = await fetchApi('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      if (res.ok) {
        const { url } = await res.json();
        setProfileImage(url);
        toast.success('Imagen subida');
      } else {
        toast.error('Error al subir imagen');
      }
    } catch (err) {
      toast.error('Error de conexión');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const stored = localStorage.getItem('user');
      if (!stored) return navigate('/login');
      const me = JSON.parse(stored);
      const token = localStorage.getItem('token');
      if (newPassword && newPassword !== confirmPassword) {
        toast.error('La nueva contraseña y su confirmación no coinciden');
        setSaving(false);
        return;
      }
      const { default: fetchApi } = await import('../lib/api');
      const res = await fetchApi(`/api/auth/users/${me.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          profileImage,
          shortDescription,
          longDescription,
          isPublicProfile,
          name,
          email,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined
        })
      });
      if (res.ok) {
        const updated = await res.json();
        // update localStorage user summary
        try {
          const newUser = { id: updated._id || updated.id || me.id, name: updated.name, email: updated.email, role: updated.role };
          localStorage.setItem('user', JSON.stringify(newUser));
          // notify same-tab listeners
          window.dispatchEvent(new Event('user-updated'));
        } catch (e) {}
        toast.success('Perfil guardado');
      } else {
        const err = await res.json();
        toast.error(err.message || 'Error al guardar');
      }
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-blue" size={48} /></div>;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
          <h1 className="text-2xl font-bold text-brand-blue mb-4">Editar perfil</h1>

          <label className="block text-sm font-medium text-gray-700 mb-2">Foto de perfil</label>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
              {profileImage ? <img src={profileImage} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">No hay</div>}
            </div>
            <label className="bg-brand-blue/10 text-brand-blue px-4 py-2 rounded-lg cursor-pointer">
              Subir
              <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
            </label>
          </div>

          <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 mb-4" placeholder="Nombre completo" />

          <label className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 mb-4" placeholder="tu@correo.cl" />

          <label className="block text-sm font-medium text-gray-700 mb-2">Descripción corta</label>
          <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 mb-4" placeholder="Una línea para describirte" />

          <label className="block text-sm font-medium text-gray-700 mb-2">Descripción larga</label>
          <textarea value={longDescription} onChange={(e) => setLongDescription(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 mb-4 min-h-[120px]" placeholder="Cuenta más sobre tu trabajo, intereses, etc."></textarea>

          <div className="mt-6">
            <h3 className="text-lg font-bold mb-3">Cambiar contraseña</h3>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña actual</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 mb-3" placeholder="Contraseña actual" />

            <label className="block text-sm font-medium text-gray-700 mb-2">Nueva contraseña</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 mb-3" placeholder="Nueva contraseña" />

            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar nueva contraseña</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 mb-4" placeholder="Repite la nueva contraseña" />
          </div>

          <div className="flex items-center space-x-3 mb-6">
            <input id="isPublic" type="checkbox" checked={isPublicProfile} onChange={(e) => setIsPublicProfile(e.target.checked)} />
            <label htmlFor="isPublic" className="text-sm">Mostrar mi perfil en la página pública (Columnista)</label>
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={handleSave} disabled={saving} className="bg-brand-blue text-white px-6 py-2 rounded-full font-bold">{saving ? 'Guardando...' : 'Guardar'}</button>
            <button onClick={() => { const stored = localStorage.getItem('user'); const me = stored ? JSON.parse(stored) : null; if (me) navigate(`/u/${me.id}`); }} className="bg-white border border-gray-200 px-6 py-2 rounded-full">Ver en público</button>
          </div>
        </div>
      </div>
    </div>
  );
}
