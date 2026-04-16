import express from 'express';
import { authenticate } from '../middleware/auth.ts';
import { upload } from '../middleware/upload.ts';

const router = express.Router();

router.post('/', authenticate, upload.single('file'), (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se subió ningún archivo' });
  }
  
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

export default router;
