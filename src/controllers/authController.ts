import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.ts';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import type { AuthRequest } from '../middleware/auth.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

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

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'El usuario ya existe' });

    const user = new User({ name, email, password, role: role === 'admin' ? 'admin' : 'editor' });
    await user.save();
    res.status(201).json({ message: 'Usuario creado exitosamente' });
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
    const safe = user.toObject(); delete safe.password; delete safe.resetPasswordToken; delete safe.resetPasswordExpires;
    console.log('Updated user', safe);
    res.json(safe);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};
