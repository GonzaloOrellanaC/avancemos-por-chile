import express from 'express';
import { login, register, forgotPassword, resetPassword, createUser } from '../controllers/authController.ts';
import { authenticate } from '../middleware/auth.ts';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/create-user', authenticate, createUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
