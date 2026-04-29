import type { Response } from 'express';
import { Tag } from '../models/Tag.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import slugify from 'slugify';

function normalizeTagName(input: unknown) {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/\s+/g, ' ');
}

function canManageTags(role?: string) {
  return role === 'admin' || role === 'editor' || role === 'columnista';
}

export const getTags = async (req: AuthRequest, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const filter = search
      ? { name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
      : {};

    const tags = await Tag.find(filter)
      .select('name slug createdAt')
      .sort({ name: 1 })
      .limit(100)
      .lean();

    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tags' });
  }
};

export const createTag = async (req: AuthRequest, res: Response) => {
  try {
    if (!canManageTags(req.user?.role)) {
      return res.status(403).json({ message: 'No tienes permiso para crear tags' });
    }

    const normalizedName = normalizeTagName(req.body?.name);
    if (!normalizedName) {
      return res.status(400).json({ message: 'Debes indicar un nombre de tag' });
    }

    const slug = slugify(normalizedName, { lower: true, strict: true, trim: true, locale: 'es' });
    if (!slug) {
      return res.status(400).json({ message: 'El tag indicado no es válido' });
    }

    const tag = await Tag.findOneAndUpdate(
      { slug },
      { $setOnInsert: { name: normalizedName, slug, createdBy: req.user.id } },
      { upsert: true, returnDocument: 'after' },
    ).select('name slug createdAt');

    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear tag' });
  }
};