import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from '../routes/authRoutes.ts';
import postRoutes from '../routes/postRoutes.ts';
import uploadRoutes from '../routes/uploadRoutes.ts';
import pageRoutes from '../routes/pageRoutes.ts';
import { errorHandler } from '../middleware/errorHandler.ts';
import { renderAppHtml, SITE_ORIGIN } from './meta.ts';

export function createApp() {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: false,
  }));

  app.set('trust proxy', true);
  app.use((req, res, next) => {
    const host = req.headers.host?.split(':')[0];
    if (host === 'avancemosporchile.cl') {
      return res.redirect(301, `${SITE_ORIGIN}${req.originalUrl}`);
    }
    next();
  });

  app.use(cors());
  app.use(express.json());

  app.use('/public', express.static(path.join(process.cwd(), 'public')));
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/pages', pageRoutes);
  app.use(errorHandler);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Avancemos Por Chile API is running' });
  });

  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', async (req, res) => {
    try {
      const html = await renderAppHtml(distPath, req.path);
      res.status(200).contentType('text/html').send(html);
    } catch {
      res.status(500).send('Error al cargar la aplicación');
    }
  });

  return app;
}