import type { Response } from 'express';
import { Petition } from '../models/Petition.ts';
import { User } from '../models/User.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import { toSlug } from '../lib/slugify.ts';
import { normalizeRut, isValidRut } from '../lib/rut.ts';
import { isValidHttpUrl } from '../lib/mediaEmbed.ts';

const VALID_STATUSES = new Set(['draft', 'published', 'closed']);

function isAdmin(role?: string) {
  return role === 'admin';
}

function normalizeEmail(input: unknown) {
  if (typeof input !== 'string') return '';
  return input.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getRequestIp(req: AuthRequest) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0]
      : '';
  return (forwardedIp || req.ip || req.socket.remoteAddress || 'unknown')
    .trim()
    .toLowerCase();
}

function sanitizeBlocks(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input
    .map((block) => {
      if (!block || typeof block !== 'object') return null;
      const candidate = block as Record<string, unknown>;
      const type = candidate.type;
      const value = typeof candidate.value === 'string' ? candidate.value.trim() : '';
      if ((type !== 'paragraph' && type !== 'image' && type !== 'pdf') || !value) {
        return null;
      }
      const caption = typeof candidate.caption === 'string' ? candidate.caption.trim() : '';
      return { type, value, caption };
    })
    .filter((block): block is { type: 'paragraph' | 'image' | 'pdf'; value: string; caption: string } => block !== null);
}

async function resolveUniqueSlug(baseSlug: string, excludeId?: string) {
  let slug = baseSlug || 'iniciativa';
  let counter = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const filter: Record<string, unknown> = { slug };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const existing = await Petition.findOne(filter).select('_id').lean();
    if (!existing) {
      return slug;
    }
    slug = `${baseSlug || 'iniciativa'}-${counter}`;
    counter += 1;
  }
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

// ---------------------------------------------------------------------------
// Endpoints públicos
// ---------------------------------------------------------------------------

export const getPublishedPetitions = async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(parseInt(String(req.query.limit || '9'), 10) || 9, 50);
    const filter = { status: 'published' };

    const [total, items] = await Promise.all([
      Petition.countDocuments(filter),
      Petition.find(filter)
        .select('title slug summary bannerImage goal signatureCount createdAt author')
        .populate('author', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    res.json({ items, total, page, totalPages, limit });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las firmas' });
  }
};

export const getPublishedPetitionBySlug = async (req: AuthRequest, res: Response) => {
  try {
    const petition = await Petition.findOne({ slug: req.params.slug, status: 'published' })
      .select('-signatures -signatureEmails -signatureRuts')
      .populate('author', 'name');

    if (!petition) {
      return res.status(404).json({ message: 'Iniciativa no encontrada' });
    }

    res.json(petition);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la iniciativa' });
  }
};

export const signPetition = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    const { name, rut, email, comuna, comment } = req.body || {};

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const normalizedRut = normalizeRut(rut);
    const normalizedEmail = normalizeEmail(email);
    const trimmedComuna = typeof comuna === 'string' ? comuna.trim() : '';
    const trimmedComment = typeof comment === 'string' ? comment.trim().slice(0, 500) : '';

    if (!trimmedName) {
      return res.status(400).json({ message: 'Debes indicar tu nombre' });
    }
    if (!normalizedRut || !isValidRut(normalizedRut)) {
      return res.status(400).json({ message: 'RUT inválido. Verifica el formato y el dígito verificador.' });
    }
    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Debes indicar un correo válido' });
    }

    const petition = await Petition.findOne({ _id: id, status: 'published' }).select('_id').lean();
    if (!petition) {
      return res.status(404).json({ message: 'Iniciativa no encontrada o no está abierta para firmas' });
    }

    // Usuario autenticado: validar/adjuntar RUT de perfil y registrar autoría.
    let submitterId: string | undefined;
    let savedRutToProfile = false;
    if (req.user?.id) {
      const user = await User.findById(req.user.id).select('_id isEnrolled documentId');
      if (user) {
        const profileRut = normalizeRut(user.documentId);
        if (user.isEnrolled && profileRut && profileRut !== normalizedRut) {
          return res.status(400).json({ message: 'El RUT debe coincidir con el registrado en tu cuenta' });
        }
        if (!profileRut) {
          user.documentId = normalizedRut;
          await user.save();
          savedRutToProfile = true;
        }
        submitterId = String(user._id);
      }
    }

    const signaturePayload: Record<string, unknown> = {
      name: trimmedName,
      rut: normalizedRut,
      comuna: trimmedComuna,
      comment: trimmedComment,
      ip: getRequestIp(req),
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'].slice(0, 300) : '',
      submitter: submitterId,
    };
    if (normalizedEmail) {
      signaturePayload.email = normalizedEmail;
    }

    const updated = await Petition.findOneAndUpdate(
      { _id: id, status: 'published', signatureRuts: { $ne: normalizedRut } },
      {
        $addToSet: { signatureRuts: normalizedRut },
        $push: { signatures: signaturePayload },
        $inc: { signatureCount: 1 },
      },
      { new: true },
    ).select('signatureCount goal');

    if (!updated) {
      return res.status(409).json({ message: 'Ya existe una firma con este RUT en esta iniciativa' });
    }

    res.status(201).json({
      message: savedRutToProfile
        ? 'Firma registrada correctamente. Tu RUT quedó guardado en tu perfil.'
        : 'Firma registrada correctamente',
      signatureCount: updated.signatureCount || 0,
      goal: updated.goal || 0,
      savedRutToProfile,
    });
  } catch (error) {
    console.error('[petitions] signPetition error', error);
    res.status(500).json({ message: 'Error al registrar la firma' });
  }
};

// ---------------------------------------------------------------------------
// Endpoints administrativos (solo admin)
// ---------------------------------------------------------------------------

export const getManagePetitions = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const rawStatus = typeof req.query.status === 'string' ? req.query.status : '';
    const filter: Record<string, unknown> = {};
    if (rawStatus && VALID_STATUSES.has(rawStatus)) {
      filter.status = rawStatus;
    }

    const items = await Petition.find(filter)
      .select('title slug summary status goal signatureCount createdAt updatedAt author')
      .populate('author', 'name')
      .sort({ createdAt: -1 });

    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: 'Error al listar las iniciativas' });
  }
};

export const getPetitionById = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const petition = await Petition.findById(req.params.id).populate('author', 'name email');
    if (!petition) {
      return res.status(404).json({ message: 'Iniciativa no encontrada' });
    }

    res.json(petition);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la iniciativa' });
  }
};

export const getPetitionSignatures = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const petition = await Petition.findById(req.params.id).select('title signatures signatureCount');
    if (!petition) {
      return res.status(404).json({ message: 'Iniciativa no encontrada' });
    }

    const signatures = (petition.signatures || []).slice().reverse();
    res.json({
      title: petition.title,
      signatureCount: petition.signatureCount || 0,
      signatures,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las firmas' });
  }
};

export const createPetition = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const { title, summary, bannerImage, goal, status, content, youtubeUrl, tiktokUrl } = req.body || {};
    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    if (!trimmedTitle) {
      return res.status(400).json({ message: 'Debes indicar el título de la iniciativa' });
    }
    if (!isValidHttpUrl(youtubeUrl)) {
      return res.status(400).json({ message: 'La URL de YouTube no es válida' });
    }
    if (!isValidHttpUrl(tiktokUrl)) {
      return res.status(400).json({ message: 'La URL de TikTok no es válida' });
    }

    const baseSlug = toSlug(trimmedTitle) || 'iniciativa';
    const slug = await resolveUniqueSlug(baseSlug);

    const petition = new Petition({
      title: trimmedTitle,
      slug,
      summary: typeof summary === 'string' ? summary.trim() : '',
      bannerImage: typeof bannerImage === 'string' ? bannerImage.trim() : '',
      youtubeUrl: typeof youtubeUrl === 'string' ? youtubeUrl.trim() : '',
      tiktokUrl: typeof tiktokUrl === 'string' ? tiktokUrl.trim() : '',
      goal: isNumber(goal) ? Math.floor(goal) : 0,
      status: VALID_STATUSES.has(status) ? status : 'draft',
      content: sanitizeBlocks(content),
      author: req.user.id,
    });

    await petition.save();
    res.status(201).json(petition);
  } catch (error) {
    console.error('[petitions] createPetition error', error);
    res.status(500).json({ message: 'Error al crear la iniciativa' });
  }
};

export const updatePetition = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const id = req.params.id;
    const petition = await Petition.findById(id);
    if (!petition) {
      return res.status(404).json({ message: 'Iniciativa no encontrada' });
    }

    const { title, summary, bannerImage, goal, status, content, youtubeUrl, tiktokUrl } = req.body || {};

    if (typeof title === 'string' && title.trim()) {
      const nextTitle = title.trim();
      const nextSlug = toSlug(nextTitle);
      if (nextSlug && nextSlug !== petition.slug) {
        petition.slug = await resolveUniqueSlug(nextSlug, id);
      }
      petition.title = nextTitle;
    }
    if (typeof summary === 'string') {
      petition.summary = summary.trim();
    }
    if (typeof bannerImage === 'string') {
      petition.bannerImage = bannerImage.trim();
    }
    if (typeof youtubeUrl === 'string') {
      if (!isValidHttpUrl(youtubeUrl)) {
        return res.status(400).json({ message: 'La URL de YouTube no es válida' });
      }
      petition.youtubeUrl = youtubeUrl.trim();
    }
    if (typeof tiktokUrl === 'string') {
      if (!isValidHttpUrl(tiktokUrl)) {
        return res.status(400).json({ message: 'La URL de TikTok no es válida' });
      }
      petition.tiktokUrl = tiktokUrl.trim();
    }
    if (isNumber(goal)) {
      petition.goal = Math.floor(goal);
    }
    if (VALID_STATUSES.has(status)) {
      petition.status = status;
    }
    if (content !== undefined) {
      petition.content = sanitizeBlocks(content);
    }

    await petition.save();
    res.json(petition);
  } catch (error) {
    console.error('[petitions] updatePetition error', error);
    res.status(500).json({ message: 'Error al actualizar la iniciativa' });
  }
};

export const deletePetition = async (req: AuthRequest, res: Response) => {
  try {
    if (!isAdmin(req.user?.role)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const petition = await Petition.findByIdAndDelete(req.params.id);
    if (!petition) {
      return res.status(404).json({ message: 'Iniciativa no encontrada' });
    }

    res.json({ message: 'Iniciativa eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la iniciativa' });
  }
};
