import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.ts';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import type { AuthRequest } from '../middleware/auth.ts';
import { renderHtmlTemplate } from '../lib/emailTemplates.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
const ALLOWED_USER_ROLES = new Set(['admin', 'editor', 'columnista']);
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3002').replace(/\/$/, '');

const createMailTransport = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('La configuración SMTP está incompleta');
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
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
  const from = process.env.CONTACT_EMAIL || process.env.SMTP_USER;
  const html = await renderHtmlTemplate('welcome-account', {
    name,
    email,
    password,
    role,
    loginUrl,
  });

  await transporter.sendMail({
    from: from ? `Avancemos por Chile <${from}>` : undefined,
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

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await (user as any).comparePassword(password))) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'El usuario ya existe' });

    const user = new User({ name, email, password });
    await user.save();
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear usuario' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    // Only admins can create users
    if (!req.user || (req.user as any).role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Faltan datos requeridos' });
    if (role && !ALLOWED_USER_ROLES.has(role)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'El usuario ya existe' });

    const nextRole = role && ALLOWED_USER_ROLES.has(role) ? role : 'editor';
    const user = new User({ name, email, password, role: nextRole });
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

    const user = await User.findById(userId).select('_id name email role');
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
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al validar la sesión' });
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

    await user.save();
    const { password: _password, resetPasswordToken: _resetPasswordToken, resetPasswordExpires: _resetPasswordExpires, ...safe } = user.toObject();
    console.log('Updated user', safe);
    res.json(safe);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};
