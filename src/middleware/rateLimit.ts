import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Almacén en memoria con ventana deslizante por IP.
const store = new Map<string, RateLimitEntry>();

function cleanup(now: number) {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

/**
 * Limita la cantidad de requests por IP dentro de una ventana de tiempo.
 * Estándar de protección contra abuso para endpoints públicos de alta sensibilidad
 * (ej: firma de propuestas oficiales).
 */
export function createRateLimiter({
  windowMs,
  max,
  message,
}: {
  windowMs: number;
  max: number;
  message: string;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    cleanup(now);

    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      return res.status(429).json({ message });
    }

    entry.count += 1;
    return next();
  };
}
