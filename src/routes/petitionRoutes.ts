import express from 'express';
import { authenticate, authorize } from '../middleware/auth.ts';
import { createRateLimiter } from '../middleware/rateLimit.ts';
import {
  getPublishedPetitions,
  getPublishedPetitionBySlug,
  signPetition,
  getManagePetitions,
  getPetitionById,
  getPetitionSignatures,
  createPetition,
  updatePetition,
  deletePetition,
} from '../controllers/petitionController.ts';

const router = express.Router();

// Endpoints públicos
router.get('/', getPublishedPetitions);
// Importante: rutas específicas antes que las de parámetro para evitar colisiones.
router.get('/slug/:slug', getPublishedPetitionBySlug);
// Firma validada con RUT: rate-limit por IP (máx. 5 firmas/hora por IP).
router.post(
  '/:id/sign',
  createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Has alcanzado el límite de firmas por hora. Intenta más tarde.',
  }),
  signPetition,
);

// Endpoints administrativos (solo admin)
router.get('/manage', authenticate, authorize(['admin']), getManagePetitions);
router.get('/:id/signatures', authenticate, authorize(['admin']), getPetitionSignatures);
router.post('/', authenticate, authorize(['admin']), createPetition);
router.get('/:id', authenticate, authorize(['admin']), getPetitionById);
router.put('/:id', authenticate, authorize(['admin']), updatePetition);
router.delete('/:id', authenticate, authorize(['admin']), deletePetition);

export default router;
