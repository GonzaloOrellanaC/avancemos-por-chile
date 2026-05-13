import type { Response } from 'express';
import { ProjectSubmission } from '../models/ProjectSubmission.ts';
import { User } from '../models/User.ts';
import type { AuthRequest } from '../middleware/auth.ts';

export const createSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, meta, submitterName } = req.body;
    const files = Array.isArray(req.body.files) ? req.body.files : [];

    const submitterId = req.user?.id;
    let submitterEmail = req.user?.email;
    if (!submitterEmail && submitterId) {
      const u = await User.findById(submitterId).select('email');
      submitterEmail = u?.email;
    }

    // Server-side: ensure submitter is enrolled
    if (submitterId) {
      const u = await User.findById(submitterId).select('isEnrolled role');
      if (!u || !u.isEnrolled) {
        return res.status(403).json({ message: 'Tu cuenta no está enrolada para enviar proyectos' });
      }
    } else {
      return res.status(401).json({ message: 'No autorizado' });
    }

    // Rate limit: max 2 submissions per 7-day window per submitter
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentCount = await ProjectSubmission.countDocuments({ submitter: submitterId, createdAt: { $gte: oneWeekAgo } });
    if (recentCount >= 2) {
      return res.status(429).json({ message: 'Has alcanzado el límite de 2 envíos por semana. Intenta más tarde.' });
    }

    const submission = new ProjectSubmission({
      title,
      description,
      files,
      submitter: submitterId,
      submitterName: submitterName || req.user?.name || '',
      submitterEmail,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      meta,
    });

    await submission.save();

    // Enfoque: se responde con 202 y el id; procesamiento asíncrono por workers.
    res.status(202).json({ id: submission._id, message: 'Envío recibido' });
  } catch (error) {
    console.error('[intake] createSubmission error', error);
    res.status(500).json({ message: 'Error al crear el envío' });
  }
};

export const getSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    const submission = await ProjectSubmission.findById(id).populate('submitter', 'name email');
    if (!submission) return res.status(404).json({ message: 'No encontrado' });

    // Permitir al submitter ver su propio envío o a roles administrativos
    if (String(submission.submitter?._id) !== String(req.user?.id) && !['admin', 'project_admin'].includes(req.user?.role)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el envío' });
  }
};

export const listSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    if (!['admin', 'project_admin'].includes(req.user?.role)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const query: any = {};
    if (status) query.status = status;

    const pageNum = Number(page) || 1;
    const perPage = Math.min(Number(limit) || 20, 100);

    const items = await ProjectSubmission.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .populate('submitter', 'name email');

    const total = await ProjectSubmission.countDocuments(query);

    res.json({ items, total, page: pageNum, perPage });
  } catch (error) {
    console.error('[intake] listSubmissions error', error);
    res.status(500).json({ message: 'Error al listar envíos' });
  }
};

export const updateSubmissionStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!['admin', 'project_admin'].includes(req.user?.role)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const id = req.params.id;
    const { status } = req.body;
    if (!['submitted', 'under_review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Estado invalido' });
    }

    const submission = await ProjectSubmission.findByIdAndUpdate(id, { status }, { new: true });
    if (!submission) return res.status(404).json({ message: 'No encontrado' });

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar estado' });
  }
};

export const listMySubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const submitterId = req.user?.id;
    if (!submitterId) return res.status(401).json({ message: 'No autorizado' });

    const submitterEmail = req.user?.email;
    const submitterName = req.user?.name;

    // include submissions where submitter id matches OR email/name match (fallback for older records)
    const orClauses: any[] = [{ submitter: submitterId }];
    if (submitterEmail) orClauses.push({ submitterEmail });
    if (submitterName) orClauses.push({ submitterName });

    const items = await ProjectSubmission.find({ $or: orClauses })
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ items });
  } catch (error) {
    console.error('[intake] listMySubmissions error', error);
    res.status(500).json({ message: 'Error al listar tus envíos' });
  }
};
