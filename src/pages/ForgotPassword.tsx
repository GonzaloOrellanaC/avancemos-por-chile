import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Email inválido'),
});

type Form = z.infer<typeof schema>;

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    setIsLoading(true);
    try {
      const { default: fetchApi } = await import('../lib/api');
      const response = await fetchApi('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setIsSent(true);
        toast.success('Si el correo existe, recibirás instrucciones');
      } else {
        const err = await response.json();
        toast.error(err.message || 'Error al solicitar recuperación');
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
        {!isSent ? (
          <>
            <div className="text-center mb-8">
              <div className="bg-brand-blue/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-brand-blue" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-brand-blue">Recuperar Contraseña</h1>
              <p className="text-gray-500 mt-2">Ingresa tu correo para recibir un enlace de recuperación</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                    placeholder="ejemplo@correo.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-blue text-white py-3 rounded-xl font-bold text-lg hover:bg-brand-red transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : <span>Enviar Enlace</span>}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="text-green-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-brand-blue mb-2">¡Correo Enviado!</h2>
            <p className="text-gray-500 mb-8">Revisa tu bandeja de entrada para continuar con la recuperación.</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/login" className="text-brand-blue hover:text-brand-red text-sm font-medium transition-colors flex items-center justify-center space-x-2">
            <ArrowLeft size={16} />
            <span>Volver al inicio de sesión</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
