import express from 'express';
import { authenticate, authorize } from '../middleware/auth.ts';
import {
  createSubmission,
  getSubmission,
  listSubmissions,
  listMySubmissions,
  updateSubmissionStatus,
} from '../controllers/intakeController.ts';

const router = express.Router();

// Public/authenticated endpoints
router.post('/', authenticate, createSubmission);
// list my submissions
router.get('/my', authenticate, listMySubmissions);
router.get('/:id', authenticate, getSubmission);

// Admin endpoints (admins or project_admins)
router.get('/', authenticate, authorize(['admin', 'project_admin']), listSubmissions);
router.patch('/:id/status', authenticate, authorize(['admin', 'project_admin']), updateSubmissionStatus);

export default router;
