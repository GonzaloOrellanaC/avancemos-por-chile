import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'motion/react';
import { Loader2, Mail, MessageSquare, Send, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import fetchApi from '../lib/api';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  email: z.string().trim().email('Debes ingresar un correo valido'),
  subject: z.string().trim().min(1, 'El asunto es obligatorio'),
  message: z.string().min(1, 'El mensaje debe contener al menos 1 caracter'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await fetchApi('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || 'No se pudo enviar tu mensaje.');
        return;
      }

      toast.success('Tu mensaje fue enviado correctamente.');
      reset();
    } catch (error) {
      toast.error('No se pudo conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef5fa_0%,#ffffff_32%,#f8fafc_100%)] pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[32px] bg-brand-blue px-8 py-10 text-white shadow-2xl"
          >
            <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-white/80">
              <Mail size={16} />
              Contacto
            </div>
            <h1 className="mt-6 text-4xl font-black leading-tight md:text-5xl">
              Conversemos.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/78">
              Envianos tu consulta mediante este formulario. El mensaje se entrega al correo oficial de contacto de Avancemos por Chile.
            </p>

            <div className="mt-10 space-y-4 rounded-[28px] bg-white/8 p-6 ring-1 ring-white/10">
              <div className="flex items-start gap-4 rounded-2xl bg-white/6 p-4">
                <div className="mt-1 rounded-full bg-brand-red p-3 text-white">
                  <UserRound size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Datos obligatorios</h2>
                  <p className="mt-1 text-sm leading-6 text-white/75">
                    Nombre, correo, asunto y mensaje son obligatorios para procesar tu contacto.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-2xl bg-white/6 p-4">
                <div className="mt-1 rounded-full bg-brand-red p-3 text-white">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Proteccion anti abuso</h2>
                  <p className="mt-1 text-sm leading-6 text-white/75">
                    La API bloquea mas de 3 intentos en menos de 30 segundos desde una misma IP.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-[32px] border border-brand-blue/10 bg-white p-8 shadow-xl md:p-10"
          >
            <div className="mb-8">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-red">Formulario de contacto</p>
              <h2 className="mt-3 text-3xl font-black text-brand-blue">Escribe tu mensaje</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                El correo se enviara a contacto@avancemosporchile.cl usando la configuracion SMTP actual del sitio.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-bold text-brand-blue">Nombre</label>
                <input
                  {...register('name')}
                  type="text"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-blue focus:bg-white focus:ring-2 focus:ring-brand-blue/15"
                  placeholder="Tu nombre"
                />
                {errors.name && <p className="mt-2 text-sm text-brand-red">{errors.name.message}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-brand-blue">Correo electronico</label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-blue focus:bg-white focus:ring-2 focus:ring-brand-blue/15"
                  placeholder="nombre@correo.com"
                />
                {errors.email && <p className="mt-2 text-sm text-brand-red">{errors.email.message}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-brand-blue">Asunto</label>
                <input
                  {...register('subject')}
                  type="text"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-blue focus:bg-white focus:ring-2 focus:ring-brand-blue/15"
                  placeholder="Motivo de tu contacto"
                />
                {errors.subject && <p className="mt-2 text-sm text-brand-red">{errors.subject.message}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-brand-blue">Mensaje</label>
                <textarea
                  {...register('message')}
                  rows={7}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-blue focus:bg-white focus:ring-2 focus:ring-brand-blue/15"
                  placeholder="Escribe tu mensaje"
                />
                {errors.message && <p className="mt-2 text-sm text-brand-red">{errors.message.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-brand-red px-6 py-4 text-base font-black text-white transition hover:bg-brand-blue disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                <span>{isSubmitting ? 'Enviando...' : 'Enviar mensaje'}</span>
              </button>
            </form>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default Contact;