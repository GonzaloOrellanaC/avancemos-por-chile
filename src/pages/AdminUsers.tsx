import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'editor'|'admin'>('editor');
  const [isCreating, setIsCreating] = useState(false);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const { default: fetchApi } = await import('../lib/api');
      const res = await fetchApi('/api/auth/users', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setUsers(await res.json());
    } catch (error) {
      console.error('Error fetching users', error);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return toast.error('Completa todos los campos');
    setIsCreating(true);
    try {
      const token = localStorage.getItem('token');
      const { default: fetchApi } = await import('../lib/api');
      const response = await fetchApi('/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, role: newRole })
      });

      if (response.ok) {
        toast.success('Usuario creado');
        setNewName(''); setNewEmail(''); setNewPassword(''); setNewRole('editor');
        await fetchUsers();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Error al crear usuario');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8" style={{marginTop: 75}}>
      <div className="mb-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center space-x-2 text-brand-blue hover:underline">
          <ArrowLeft size={18} />
          <span>Atrás</span>
        </button>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 mb-8">
        <h2 className="text-xl font-bold text-brand-blue mb-4">Crear nuevo usuario</h2>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre" className="p-3 bg-gray-50 rounded-lg" />
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Correo" className="p-3 bg-gray-50 rounded-lg" />
          <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Contraseña" type="password" className="p-3 bg-gray-50 rounded-lg" />
          <div className="flex items-center space-x-2">
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)} className="p-3 bg-gray-50 rounded-lg">
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
            <button disabled={isCreating} className="bg-brand-blue text-white px-4 py-2 rounded-lg font-bold">{isCreating ? 'Creando...' : 'Crear'}</button>
          </div>
        </form>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
        <h2 className="text-xl font-bold text-brand-blue mb-4">Listado de usuarios</h2>
        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Nombre</th>
                  <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Correo</th>
                  <th className="pb-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u._id} className="group">
                    <td className="py-4 font-bold text-brand-blue">{u.name}</td>
                    <td className="py-4 text-sm text-gray-500">{u.email}</td>
                    <td className="py-4 text-sm text-gray-500">{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 mb-4">No hay usuarios aún.</p>
          </div>
        )}
      </div>
    </div>
  );
}
