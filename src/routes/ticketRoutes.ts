import express from 'express';
import { authenticate, authorize } from '../middleware/auth.ts';
import { getNewTicketId, createTicket, listMyTickets, getTicket, replyTicket, closeTicket } from '../controllers/ticketController.ts';

const router = express.Router();

router.get('/new-id', authenticate, getNewTicketId);
router.post('/', authenticate, createTicket);
router.get('/my', authenticate, listMyTickets);
router.get('/:id', authenticate, getTicket);
router.post('/:id/reply', authenticate, replyTicket);
router.post('/:id/close', authenticate, closeTicket);

export default router;
