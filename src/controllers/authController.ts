import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.ts';
import crypto from 'crypto';
import type { AuthRequest } from '../middleware/auth.ts';
import { renderHtmlTemplate } from '../lib/emailTemplates.ts';
import { createMailTransport, getMailFromAddress } from '../lib/mail.ts';
import { isValidRut, normalizeRut } from '../lib/rut.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
const ALLOWED_USER_ROLES = new Set(['admin', 'editor', 'columnista', 'project_admin', 'usuario']);
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3002').replace(/\/$/, '');
const BACKEND_URL = (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');

const sendEnrollmentEmail = async ({ name, email, userId }: { name: string; email: string; userId: string }) => {
  const transporter = createMailTransport();
  const from = getMailFromAddress();

  const token = jwt.sign({ id: userId, action: 'activate' }, JWT_SECRET, { expiresIn: '7d' });
  // Use frontend URL so activation link points to the client (production-safe)
  const activationUrl = `${FRONTEND_URL.replace(/\/$/, '')}/activate?token=${encodeURIComponent(token)}`;

  const subject = 'Activa tu cuenta en Avancemos Por Chile';
  const text = [
    `Hola ${name},`,
    '',
    'Gracias por registrarte en Avancemos Por Chile.',
    'Para activar tu cuenta y completar el enrolamiento, haz clic en el siguiente enlace:',
    '',
    activationUrl,
    '',
    'Si no solicitaste este correo, ignóralo.',
  ].join('\n');

  const html = [`<p>Hola ${name},</p>`, `<p>Gracias por registrarte en Avancemos Por Chile.</p>`, `<p>Para activar tu cuenta y completar el enrolamiento, haz clic en el siguiente enlace:</p>`, `<p><a href="${activationUrl}">Activar cuenta</a></p>`, `<p>Si no solicitaste este correo, ignóralo.</p>`].join('');

  await transporter.sendMail({
    from: from ? `Avancemos por Chile <${from}>` : undefined,
    to: email,
    subject,
    text,
    html,
  });
};

const sendPostActivationEmail = async ({ name, email }: { name: string; email: string }) => {
  const transporter = createMailTransport();
  const from = getMailFromAddress();
  const loginUrl = `${FRONTEND_URL}/login`;

  const subject = 'Cuenta activada en Avancemos Por Chile';
  const text = [
    `Hola ${name},`,
    '',
    'Tu cuenta ha sido activada correctamente. Ahora puedes iniciar sesión:',
    '',
    loginUrl,
    '',
    'Gracias por sumarte a Avancemos Por Chile.',
  ].join('\n');

  const html = [`<p>Hola ${name},</p>`, `<p>Tu cuenta ha sido activada correctamente. Ahora puedes iniciar sesión:</p>`, `<p><a href="${loginUrl}">Iniciar sesión</a></p>`, `<p>Gracias por sumarte a Avancemos Por Chile.</p>`].join('');

  await transporter.sendMail({
    from: from ? `Avancemos por Chile <${from}>` : undefined,
    to: email,
    subject,
    text,
    html,
  });
};

const sendWelcomeEmail = async ({
  name,
  email,
  password,
  role,
}: {
  name: string;
  email: string;
  password: string;
  role: string;
}) => {
  const transporter = createMailTransport();
  const loginUrl = `${FRONTEND_URL}/login`;
  const from = getMailFromAddress();
  const html = await renderHtmlTemplate('welcome-account', {
    name,
    email,
    password,
    role,
    loginUrl,
  });

  await transporter.sendMail({
    from: from ? `Avancemos por Chile <${from}>` : undefined,
    bcc: process.env.CC_EMAIL || undefined,
    to: email,
    subject: 'Bienvenido a Avancemos por Chile',
    text: [
      `Hola, ${name}.`,
      '',
      'Tu cuenta en Avancemos por Chile ha sido creada por el super administrador.',
      '',
      `Correo: ${email}`,
      `Contraseña: ${password}`,
      `Rol: ${role}`,
      `Acceso: ${loginUrl}`,
      '',
      'Te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.',
    ].join('\n'),
    html,
  });
};

const sendTestEmail = async ({
  to,
  requestedBy,
}: {
  to: string;
  requestedBy: string;
}) => {
  const transporter = createMailTransport();
  const from = getMailFromAddress();

  return transporter.sendMail({
    from: from ? `Avancemos por Chile <${from}>` : undefined,
    bcc: process.env.CC_EMAIL || undefined,
    to,
    subject: 'Prueba de correo SMTP',
    text: [
      'Este es un correo de prueba enviado desde la API de Avancemos por Chile.',
      '',
      `Solicitado por: ${requestedBy}`,
      `Fecha: ${new Date().toISOString()}`,
    ].join('\n'),
    html: [
      '<p>Este es un correo de prueba enviado desde la API de Avancemos por Chile.</p>',
      `<p><strong>Solicitado por:</strong> ${requestedBy}</p>`,
      `<p><strong>Fecha:</strong> ${new Date().toISOString()}</p>`,
    ].join(''),
  });
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await (user as any).comparePassword(password))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEnrolled: !!user.isEnrolled,
        rut: user.documentId || '',
        hasRut: !!user.documentId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, documentId, phone, organization, enrollmentNotes } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'El usuario ya existe' });

    // validate RUT if provided
    if (documentId && !isValidRut(documentId)) {
      return res.status(400).json({ message: 'RUT inválido' });
    }

    const user = new User({
      name,
      email,
      password,
      role: 'usuario',
      isEnrolled: false,
      enrollmentRequestedAt: new Date(),
      documentId: documentId || undefined,
      phone: phone || undefined,
      organization: organization || undefined,
      enrollmentNotes: enrollmentNotes || undefined,
    });

    await user.save();

    try {
      await sendEnrollmentEmail({ name: user.name, email: user.email, userId: String(user._id) });
    } catch (mailErr) {
      console.error('Error enviando email de enrolamiento:', mailErr);
    }

    res.status(201).json({ message: 'Usuario creado exitosamente. Revisa tu correo para activar la cuenta.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear usuario' });
  }
};

export const activateUser = async (req: Request, res: Response) => {
  try {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    if (!token) return res.status(400).send('Token faltante');

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).send('Token inválido o expirado');
    }

    if (!decoded || decoded.action !== 'activate' || !decoded.id) {
      const wantsJson = String(req.headers.accept || '').includes('application/json') || !!(req as any).xhr;
      return wantsJson ? res.status(400).json({ success: false, message: 'Token inválido' }) : res.status(400).send('Token inválido');
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).send('Usuario no encontrado');

    const wantsJson = String(req.headers.accept || '').includes('application/json') || !!(req as any).xhr;

    if (user.isEnrolled) {
      return wantsJson ? res.json({ success: true, alreadyEnrolled: true }) : res.redirect(`${FRONTEND_URL}/login?activated=1`);
    }

    user.isEnrolled = true;
    user.enrolledAt = new Date();
    user.enrolledBy = undefined as any;
    await user.save();

    try {
      await sendPostActivationEmail({ name: user.name, email: user.email });
    } catch (mailErr) {
      console.error('Error sending post-activation email:', mailErr);
    }

    return wantsJson ? res.json({ success: true, message: 'Cuenta activada' }) : res.redirect(`${FRONTEND_URL}/login?activated=1`);
  } catch (err) {
    console.error('Error activating user:', err);
    const wantsJson = String(req.headers.accept || '').includes('application/json') || !!(req as any).xhr;
    return wantsJson ? res.status(500).json({ success: false, message: 'Error activando usuario' }) : res.status(500).send('Error activando usuario');
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    // Only admins can create users
    if (!req.user || (req.user as any).role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const { name, email, password, role, isEnrolled } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Faltan datos requeridos' });
    if (role && !ALLOWED_USER_ROLES.has(role)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'El usuario ya existe' });

    const nextRole = role && ALLOWED_USER_ROLES.has(role) ? role : 'editor';
    const user = new User({ name, email, password, role: nextRole, isEnrolled: !!isEnrolled });
    await user.save();

    let welcomeEmailSent = true;

    try {
      await sendWelcomeEmail({ name, email, password, role: nextRole });
    } catch (mailError) {
      welcomeEmailSent = false;
      console.error('Error enviando correo de bienvenida:', mailError);
    }

    res.status(201).json({
      message: welcomeEmailSent
        ? 'Usuario creado exitosamente. Se envió el correo de bienvenida.'
        : 'Usuario creado exitosamente, pero no se pudo enviar el correo de bienvenida.',
      welcomeEmailSent,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear usuario' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    // Only admins can list users
    if (!req.user || (req.user as any).role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const users = await User.find({}, { password: 0, resetPasswordToken: 0, resetPasswordExpires: 0 }).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

export const validateToken = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    const user = await User.findById(userId).select('_id name email role isEnrolled documentId');
    if (!user) {
      return res.status(401).json({ message: 'La sesión ya no es válida' });
    }

    res.json({
      valid: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEnrolled: !!user.isEnrolled,
        rut: user.documentId || '',
        hasRut: !!user.documentId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al validar la sesión' });
  }
};

// Actualiza el RUT del propio usuario (autenticado). Usado para firmas oficiales.
export const updateMyRut = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const rawRut = req.body?.rut;
    const normalized = normalizeRut(rawRut);
    if (!normalized || !isValidRut(normalized)) {
      return res.status(400).json({ message: 'RUT inválido' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.documentId = normalized;
    await user.save();

    res.json({ message: 'RUT actualizado correctamente', rut: normalized });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el RUT' });
  }
};

export const sendEmailTest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const to = typeof req.query.to === 'string' ? req.query.to.trim() : '';
    const fallbackEmail = getMailFromAddress() || '';
    const targetEmail = to || fallbackEmail;

    if (!targetEmail) {
      return res.status(400).json({ message: 'Debes indicar el query param to o configurar CONTACT_EMAIL/SMTP_USER' });
    }

    const info = await sendTestEmail({
      to: targetEmail,
      requestedBy: req.user.email || req.user.id || 'admin',
    });

    res.json({
      message: 'Correo de prueba enviado',
      to: targetEmail,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (error) {
    console.error('Error enviando correo de prueba:', error);
    res.status(500).json({ message: 'No se pudo enviar el correo de prueba' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  // Mock implementation for now
  res.json({ message: 'Si el correo existe, se enviará un enlace de recuperación' });
};

export const resetPassword = async (req: Request, res: Response) => {
  // Mock implementation for now
  res.json({ message: 'Contraseña actualizada correctamente' });
};

// Get single user by id. If profile is public, anyone can view it. Otherwise only admin or owner.
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, '-password -resetPasswordToken -resetPasswordExpires');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (user.isPublicProfile) {
      return res.json(user);
    }

    // Not public -> require auth and owner/admin
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No autorizado' });
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded.role === 'admin' || decoded.id === String(user._id)) {
        return res.json(user);
      }
      return res.status(403).json({ message: 'No tienes permiso para ver este perfil' });
    } catch (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
};

// Update own profile (profileImage, shortDescription, longDescription, isPublicProfile, name, email, password)
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    console.log('Update user', id, req.body);
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No autorizado' });
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded.id !== id && decoded.role !== 'admin') return res.status(403).json({ message: 'No tienes permiso' });

    const { profileImage, shortDescription, longDescription, isPublicProfile, name, email, currentPassword, newPassword } = req.body;
    // Admin-only editable fields
    const { role: requestedRole, isEnrolled: requestedIsEnrolled, enrollmentNotes, documentId, phone, organization } = req.body as any;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Update basic profile fields
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (shortDescription !== undefined) user.shortDescription = shortDescription;
    if (longDescription !== undefined) user.longDescription = longDescription;
    if (isPublicProfile !== undefined) user.isPublicProfile = isPublicProfile;

    // Update name/email if provided
    if (name !== undefined) user.name = name;
    if (email !== undefined && email !== user.email) {
      // ensure email not used by another account
      const existing = await User.findOne({ email });
      if (existing && String(existing._id) !== String(user._id)) {
        return res.status(400).json({ message: 'El correo ya está en uso' });
      }
      user.email = email;
    }

    // Password change: require currentPassword unless admin
    if (newPassword) {
      if (decoded.role === 'admin') {
        // admin can set password without current
        user.password = newPassword;
      } else {
        if (!currentPassword) return res.status(400).json({ message: 'Se requiere la contraseña actual para cambiarla' });
        const ok = await (user as any).comparePassword(currentPassword);
        if (!ok) return res.status(401).json({ message: 'Contraseña actual incorrecta' });
        user.password = newPassword;
      }
    }

    // Admin can update role, enrollment status and identification fields
    if (decoded.role === 'admin') {
      if (requestedRole && ALLOWED_USER_ROLES.has(requestedRole)) {
        user.role = requestedRole;
      }

      if (typeof requestedIsEnrolled === 'boolean' && requestedIsEnrolled !== user.isEnrolled) {
        user.isEnrolled = requestedIsEnrolled;
        if (requestedIsEnrolled) {
          user.enrolledAt = new Date();
          user.enrolledBy = decoded.id;
        } else {
          user.enrolledAt = undefined as any;
          user.enrolledBy = undefined as any;
        }
      }

      if (enrollmentNotes !== undefined) user.enrollmentNotes = enrollmentNotes;
      if (documentId !== undefined) {
        if (documentId && !isValidRut(documentId)) {
          return res.status(400).json({ message: 'RUT inválido' });
        }
        user.documentId = documentId;
      }
      if (phone !== undefined) user.phone = phone;
      if (organization !== undefined) user.organization = organization;
    }

    await user.save();
    const { password: _password, resetPasswordToken: _resetPasswordToken, resetPasswordExpires: _resetPasswordExpires, ...safe } = user.toObject();
    console.log('Updated user', safe);
    res.json(safe);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};
