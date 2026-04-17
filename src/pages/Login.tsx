import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const { default: fetchApi } = await import('../lib/api');
      const response = await fetchApi('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        toast.success('Bienvenido de nuevo');
        navigate('/profile');
      } else {
        toast.error(result.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-gray-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100"
      >
        <div className="text-center mb-8">
          <div className="bg-brand-blue/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="text-brand-blue" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-brand-blue">Acceso Editores</h1>
          <p className="text-gray-500 mt-2">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                {...register('email')}
                type="email"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all"
                placeholder="ejemplo@correo.com"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                {...register('password')}
                type="password"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-blue text-white py-3 rounded-xl font-bold text-lg hover:bg-brand-red transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" size={24} /> : <span>Entrar</span>}
          </button>
        </form>

        <div className="mt-8 text-center space-y-2">
          <Link to="/forgot-password" className="text-brand-blue hover:text-brand-red text-sm font-medium transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
