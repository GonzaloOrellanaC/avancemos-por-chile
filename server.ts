import 'dotenv/config'
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './src/lib/db.ts';
import authRoutes from './src/routes/authRoutes.ts';
import postRoutes from './src/routes/postRoutes.ts';
import uploadRoutes from './src/routes/uploadRoutes.ts';
import pageRoutes from './src/routes/pageRoutes.ts';
import { errorHandler } from './src/middleware/errorHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await connectDB();
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(helmet({
    contentSecurityPolicy: false,
  }));
  app.use(cors());
  app.use(express.json());

  // Serve public folder as static (for public assets)
  app.use('/public', express.static(path.join(process.cwd(), 'public')));

  // Serve static uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/pages', pageRoutes);
  
  app.use(errorHandler);
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Avancemos Por Chile API is running' });
  });
  
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    try {
      res.sendFile(path.join(distPath, 'index.html'));
    } catch (error) {
      res.status(500).send('Error al cargar la aplicación');
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
