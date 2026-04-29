import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from '../routes/authRoutes.ts';
import postRoutes from '../routes/postRoutes.ts';
import uploadRoutes from '../routes/uploadRoutes.ts';
import pageRoutes from '../routes/pageRoutes.ts';
import notificationRoutes from '../routes/notificationRoutes.ts';
import { errorHandler } from '../middleware/errorHandler.ts';
import { renderAppHtml, SITE_ORIGIN } from './meta.ts';

function normalizeRenderablePath(rawPath?: unknown) {
  const candidate = Array.isArray(rawPath) ? rawPath[0] : rawPath;
  if (typeof candidate !== 'string') {
    return null;
  }

  const trimmedCandidate = candidate.trim();
  if (!trimmedCandidate) {
    return null;
  }

  try {
    const url = new URL(trimmedCandidate, SITE_ORIGIN);
    if (url.origin !== SITE_ORIGIN) {
      return null;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export function createApp() {
  const app = express();
  const uploadsPath = path.join(process.cwd(), 'uploads');

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

  app.use('/uploads/social', express.static(path.join(uploadsPath, 'social'), {
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  }));
  app.use('/public', express.static(path.join(process.cwd(), 'public')));
  app.use('/uploads', express.static(uploadsPath));

  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/pages', pageRoutes);
  app.use(errorHandler);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Avancemos Por Chile API is running' });
  });

  const distPath = path.join(process.cwd(), 'dist');
  app.get('/api/rendered-page', async (req, res) => {
    const requestPath = normalizeRenderablePath(req.query.path);
    if (!requestPath) {
      return res.status(400).json({
        message: 'Debes enviar un path interno valido, por ejemplo /blog/mi-publicacion',
      });
    }

    try {
      const html = await renderAppHtml(distPath, requestPath);
      res.status(200).contentType('text/html').send(html);
    } catch (error) {
      console.error('[rendered-page] Error rendering path', {
        requestPath,
        error,
      });
      res.status(500).json({ message: 'No se pudo renderizar la pagina solicitada' });
    }
  });

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