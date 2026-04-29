import type { Request, Response } from 'express';
import { createMailTransport, getMailFromAddress } from '../lib/mail.ts';

const CONTACT_RATE_LIMIT_WINDOW_MS = 30_000;
const CONTACT_RATE_LIMIT_MAX_ATTEMPTS = 3;

const contactAttemptsByIp = new Map<string, number[]>();

const getRequestIp = (req: Request) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0].trim();
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const registerAttempt = (ip: string, now: number) => {
  const recentAttempts = (contactAttemptsByIp.get(ip) || []).filter((timestamp) => now - timestamp < CONTACT_RATE_LIMIT_WINDOW_MS);
  recentAttempts.push(now);
  contactAttemptsByIp.set(ip, recentAttempts);
  return recentAttempts.length;
};

export const sendContactMessage = async (req: Request, res: Response) => {
  const now = Date.now();
  const requestIp = getRequestIp(req);
  const attempts = registerAttempt(requestIp, now);

  if (attempts > CONTACT_RATE_LIMIT_MAX_ATTEMPTS) {
    return res.status(429).json({
      message: 'Demasiados intentos de envio. Espera 30 segundos antes de intentarlo nuevamente.',
    });
  }

  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

    if (!name || !email || !subject || message.length < 1) {
      return res.status(400).json({
        message: 'Todos los campos son obligatorios y el mensaje debe contener al menos 1 caracter.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Debes ingresar un correo electronico valido.' });
    }

    const transporter = createMailTransport();
    const from = getMailFromAddress();

    const info = await transporter.sendMail({
      from: from ? `Avancemos por Chile <${from}>` : undefined,
      to: 'contacto@avancemosporchile.cl',
      replyTo: email,
      subject: `Intento de contacto desde formulario web: ${subject}`,
      text: [
        'Este correo corresponde a un intento de contacto enviado mediante el formulario web.',
        '',
        `Nombre: ${name}`,
        `Correo: ${email}`,
        `Asunto: ${subject}`,
        '',
        'Mensaje:',
        message,
      ].join('\n'),
      html: [
        '<p>Este correo corresponde a un <strong>intento de contacto enviado mediante el formulario web</strong>.</p>',
        `<p><strong>Nombre:</strong> ${name}</p>`,
        `<p><strong>Correo:</strong> ${email}</p>`,
        `<p><strong>Asunto:</strong> ${subject}</p>`,
        '<p><strong>Mensaje:</strong></p>',
        `<p>${message.replace(/\n/g, '<br />')}</p>`,
      ].join(''),
    });

    return res.status(200).json({
      message: 'Tu mensaje fue enviado correctamente.',
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('Error enviando correo de contacto:', error);
    return res.status(500).json({ message: 'No se pudo enviar el mensaje de contacto.' });
  }
};