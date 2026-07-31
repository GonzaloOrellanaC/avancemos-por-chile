/**
 * Utilidades para convertir enlaces de YouTube / TikTok en URLs de embed.
 * Devuelven null si el enlace no es reconocido.
 */

/** Extrae la URL de embed de un enlace de YouTube (o null si no es válido). */
export function getYouTubeEmbedUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url.trim()) return null;

  try {
    const parsed = new URL(url.trim());

    if (parsed.hostname === 'youtu.be' || parsed.hostname.endsWith('.youtu.be')) {
      const id = parsed.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (parsed.hostname === 'youtube.com' || parsed.hostname.endsWith('.youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        return url.trim();
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.split('/')[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const videoId = parsed.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/** Extrae la URL de embed de un enlace de TikTok (o null si no es válido). */
export function getTikTokEmbedUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url.trim()) return null;

  try {
    const parsed = new URL(url.trim());
    const match = parsed.pathname.match(/\/video\/(\d+)/);
    if (match) {
      return `https://www.tiktok.com/embed/v2/${match[1]}`;
    }
    return null;
  } catch {
    return null;
  }
}

/** Indica si una URL es http(s). Una cadena vacía se considera válida (sin link). */
export function isValidHttpUrl(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return true;

  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
