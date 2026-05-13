import type { Response } from 'express';
import { Ticket } from '../models/Ticket.ts';
import { Notification } from '../models/Notification.ts';
import { User } from '../models/User.ts';
import type { AuthRequest } from '../middleware/auth.ts';

export const getNewTicketId = async (_req: AuthRequest, res: Response) => {
  // Simple time-based ID; can be replaced with a counter/sequence if needed
  const id = `T-${Date.now()}`;
  res.json({ ticketId: id });
};

export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { ticketId, title, description, files } = req.body;
    const submitterId = req.user?.id;
    const submitterEmail = req.user?.email;

    const ticket = new Ticket({ ticketId, title, description, files: files || [], submitter: submitterId, submitterEmail });
    await ticket.save();

    // notify all admins
    const admins = await User.find({ role: 'admin' }).select('_id');
    const notifications = admins.map(a => ({
      user: a._id,
      triggeredBy: submitterId,
      type: 'ticket_created',
      title: `Nuevo ticket: ${title}`,
      message: `Se ha creado el ticket ${ticketId}`,
    }));
    await Notification.insertMany(notifications);

    res.status(201).json({ message: 'Ticket creado', ticket });
  } catch (error) {
    console.error('createTicket error', error);
    res.status(500).json({ message: 'Error al crear ticket' });
  }
};

export const listMyTickets = async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    if (isAdmin) {
      const all = await Ticket.find().sort({ createdAt: -1 })
        .populate('submitter', 'name email')
        .populate('replies.author', 'name email role');
      return res.json(all);
    }

    const mine = await Ticket.find({ submitter: req.user.id }).sort({ createdAt: -1 })
      .populate('replies.author', 'name email role');
    res.json(mine);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tickets' });
  }
};

export const getTicket = async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.id })
      .populate('submitter', 'name email')
      .populate('replies.author', 'name email role');
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    // ensure non-admin can only access their own tickets
    if (req.user.role !== 'admin' && String(ticket.submitter?._id) !== String(req.user.id)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener ticket' });
  }
};

export const replyTicket = async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    const { body, files } = req.body;
    ticket.replies.push({ author: req.user.id, body, files: files || [] });
    // if admin replies, mark pending? keep open
    await ticket.save();

    // notify ticket owner
    if (ticket.submitter) {
      await Notification.create({
        user: ticket.submitter,
        triggeredBy: req.user.id,
        type: 'ticket_reply',
        title: `Respuesta a ${ticket.ticketId}`,
        message: `Hay una nueva respuesta en el ticket ${ticket.ticketId}`,
      });
    }

    res.json({ message: 'Respuesta enviada', ticket });
  } catch (error) {
    console.error('replyTicket error', error);
    res.status(500).json({ message: 'Error al responder ticket' });
  }
};

export const closeTicket = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'No autorizado' });
    const ticket = await Ticket.findOne({ ticketId: req.params.id });
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    const { body, files } = req.body;
    if ((!body || !String(body).trim()) && (!files || !files.length)) {
      return res.status(400).json({ message: 'Debes incluir una respuesta o archivos al cerrar el ticket' });
    }

    // push reply from admin and close
    ticket.replies.push({ author: req.user.id, body, files: files || [] });
    ticket.status = 'closed';
    await ticket.save();

    // notify owner
    if (ticket.submitter) {
      await Notification.create({
        user: ticket.submitter,
        triggeredBy: req.user.id,
        type: 'ticket_reply',
        title: `Ticket cerrado: ${ticket.ticketId}`,
        message: `El ticket ${ticket.ticketId} ha sido cerrado por el equipo de soporte.`,
      });
    }

    res.json({ message: 'Ticket cerrado', ticket });
  } catch (error) {
    console.error('closeTicket error', error);
    res.status(500).json({ message: 'Error al cerrar ticket' });
  }
};
