import express from 'express';
import { sendContactMessage } from '../controllers/contactController.ts';

const router = express.Router();

router.post('/', sendContactMessage);

export default router;