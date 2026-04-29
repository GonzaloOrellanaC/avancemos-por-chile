import express from 'express';
import { login, register, forgotPassword, resetPassword, createUser, getUsers, getUserById, updateUser, validateToken } from '../controllers/authController.ts';
import { authenticate } from '../middleware/auth.ts';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/validate-token', authenticate, validateToken);
router.post('/create-user', authenticate, createUser);
router.get('/users', authenticate, getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', authenticate, updateUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
