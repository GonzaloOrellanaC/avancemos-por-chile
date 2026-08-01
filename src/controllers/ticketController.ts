import type { Response } from 'express';
import { Ticket } from '../models/Ticket.ts';
import { Notification } from '../models/Notification.ts';
import { User } from '../models/User.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import { createSupportMailTransport, getSupportMailFromAddress } from '../lib/mail.ts';

export const getNewTicketId = async (_req: AuthRequest, res: Response) => {
  // Simple time-based ID; can be replaced with a counter/sequence if needed
  const id = `T-${Date.now()}`;
  res.json({ ticketId: id });
};

export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { ticketId, title, description, files } = req.body;
    // Seguridad: el ticket siempre se atribuye al usuario autenticado.
    // Solo un admin puede indicar otro submitterId explícitamente.
    const isAdmin = req.user?.role === 'admin';
    const submitterId = (isAdmin && req.body?.submitterId) || req.user?.id;
    const submitterUser = submitterId ? await User.findById(submitterId).select('email') : null;

    const ticket = new Ticket({ ticketId, title, description, files: files || [], submitter: submitterId, submitterEmail: submitterUser?.email });
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

    // send confirmation emails to submitter and support
    try {
      const transporter = createSupportMailTransport();
      const from = getSupportMailFromAddress();
      const to = [submitterUser?.email, process.env.SUPPORT_EMAIL].filter(Boolean) as string[];
      /* const bcc = [process.env.SUPPORT_EMAIL].filter(Boolean) as string[]; */
      const info = await transporter.sendMail({
        from,
        to,
        /* bcc, */
        subject: `Nuevo ticket: ${ticket.ticketId}`,
        text: `Se ha creado un nuevo ticket (${ticket.ticketId}).\n\nTítulo: ${title}\n\nDescripción:\n${description}`,
        html: `<p>Se ha creado un nuevo ticket <strong>${ticket.ticketId}</strong>.</p><p><strong>Título:</strong> ${title}</p><p><strong>Descripción:</strong><br/>${description}</p>`
      });
      console.log('[mail][ticket:create] Sent', { ticketId: ticket.ticketId, to, messageId: info.messageId, accepted: info.accepted, rejected: info.rejected });
      if (info.rejected && info.rejected.length) console.warn('[mail][ticket:create] Some recipients rejected', info.rejected);
    } catch (err) {
      console.warn('Error sending ticket creation email', err);
    }

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
    if (req.user.role !== 'admin') {
      const submitterId = ticket.submitter && (ticket.submitter as any)._id ? String((ticket.submitter as any)._id) : String(ticket.submitter);
      if (submitterId !== String(req.user.id)) {
        return res.status(403).json({ message: 'No autorizado' });
      }
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

    // Seguridad: solo el dueño del ticket o un admin pueden responder.
    const submitterId = ticket.submitter && (ticket.submitter as any)._id
      ? String((ticket.submitter as any)._id)
      : String(ticket.submitter || '');
    if (req.user.role !== 'admin' && submitterId !== String(req.user.id)) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const { body, files } = req.body;
    ticket.replies.push({ author: req.user.id, body, files: files || [] });
    /* const submitterUser = await User.findById(ticket.submitter); */
    /* const submitterEmail = submitterUser?.email === process.env.SUPPORT_EMAIL */
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
      // send email to ticket owner and support
      /* try {
        const transporter = createSupportMailTransport();
        const from = getSupportMailFromAddress();
        const ownerEmail = submitterEmail || '';
        const to = [ownerEmail].filter(Boolean) as string[];
        const bcc = [process.env.SUPPORT_EMAIL].filter(Boolean) as string[];
        const info = await transporter.sendMail({
          from,
          to,
          bcc,
          subject: `Respuesta ticket: ${ticket.ticketId}`,
          text: `Hay una nueva respuesta en el ticket ${ticket.ticketId}:\n\n${body}`,
          html: `<p>Hay una nueva respuesta en el ticket <strong>${ticket.ticketId}</strong>.</p><p>${body}</p>`
        });
        console.log('[mail][ticket:reply] Sent', { ticketId: ticket.ticketId, to, messageId: info.messageId, accepted: info.accepted, rejected: info.rejected });
        if (info.rejected && info.rejected.length) console.warn('[mail][ticket:reply] Some recipients rejected', info.rejected);
      } catch (err) {
        console.warn('Error sending ticket reply email', err);
      } */
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
      // send closing email
      /* try {
        const submitterUser = await User.findById(ticket.submitter);
        const transporter = createSupportMailTransport();
        const from = getSupportMailFromAddress();
        const ownerEmail = submitterUser?.email || '';
        const to = [ownerEmail].filter(Boolean) as string[];
        const bcc = [process.env.SUPPORT_EMAIL].filter(Boolean) as string[];
        const info = await transporter.sendMail({
          from,
          to,
          bcc,
          subject: `Ticket cerrado: ${ticket.ticketId}`,
          text: `El ticket ${ticket.ticketId} ha sido cerrado por el equipo de soporte.\n\nRespuesta de cierre:\n${body}`,
          html: `<p>El ticket <strong>${ticket.ticketId}</strong> ha sido cerrado por el equipo de soporte.</p><p><strong>Respuesta de cierre:</strong><br/>${body}</p>`
        });
        console.log('[mail][ticket:close] Sent', { ticketId: ticket.ticketId, to, messageId: info.messageId, accepted: info.accepted, rejected: info.rejected });
        if (info.rejected && info.rejected.length) console.warn('[mail][ticket:close] Some recipients rejected', info.rejected);
      } catch (err) {
        console.warn('Error sending ticket closed email', err);
      } */
    }

    res.json({ message: 'Ticket cerrado', ticket });
  } catch (error) {
    console.error('closeTicket error', error);
    res.status(500).json({ message: 'Error al cerrar ticket' });
  }
};
