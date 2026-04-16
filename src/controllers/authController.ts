import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.ts';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

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

export const forgotPassword = async (req: Request, res: Response) => {
  // Mock implementation for now
  res.json({ message: 'Si el correo existe, se enviará un enlace de recuperación' });
};

export const resetPassword = async (req: Request, res: Response) => {
  // Mock implementation for now
  res.json({ message: 'Contraseña actualizada correctamente' });
};
