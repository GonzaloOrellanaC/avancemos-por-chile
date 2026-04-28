import fs from 'fs/promises';
import path from 'path';
import { Post } from '../models/Post.ts';

export const SITE_ORIGIN = 'https://www.avancemosporchile.cl';

const DEFAULT_IMAGE = `${SITE_ORIGIN}/isotipo-avancemosporchile.png`;
const DEFAULT_TITLE = 'Avancemos Por Chile';
const DEFAULT_DESCRIPTION = 'Avancemos Por Chile — Noticias, artículos y propuestas. Mantente informado sobre nuestras actividades y propuestas nacionales.';

type ContentBlock = {
  type?: string;
  value?: string;
  caption?: string;
};

type MetaPayload = {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  twitterImageUrl: string;
  imageAlt: string;
  ogType: 'website' | 'article';
  publishedTime?: string;
  authorName?: string;
};

type RenderPayload = {
  meta: MetaPayload;
  appHtml: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function normalizeText(value?: string) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function toCanonicalUrl(requestPath: string) {
  const normalizedPath = requestPath === '/' ? '/' : requestPath.replace(/\/+$/, '');
  return new URL(normalizedPath, SITE_ORIGIN).toString();
}

function toAbsoluteAssetUrl(assetUrl?: string | null) {
  const normalizedAssetUrl = normalizeText(assetUrl || '').replace(/\\/g, '/');
  if (!normalizedAssetUrl) {
    return DEFAULT_IMAGE;
  }

  try {
    const isAbsoluteUrl = /^https?:\/\//i.test(normalizedAssetUrl);
    const assetPath = isAbsoluteUrl
      ? normalizedAssetUrl
      : normalizedAssetUrl.startsWith('/')
        ? normalizedAssetUrl
        : `/${normalizedAssetUrl}`;

    const url = new URL(assetPath, SITE_ORIGIN);
    if (url.hostname === 'avancemosporchile.cl') {
      url.hostname = 'www.avancemosporchile.cl';
      url.protocol = 'https:';
    }
    return url.toString();
  } catch {
    return DEFAULT_IMAGE;
  }
}

function getPostDescription(content: ContentBlock[] = [], authorName?: string) {
  const firstParagraph = content.find((block) => block.type === 'paragraph' && normalizeText(block.value));
  const firstCaption = content.find((block) => normalizeText(block.caption));
  const descriptionSource = normalizeText(firstParagraph?.value) || normalizeText(firstCaption?.caption) || DEFAULT_DESCRIPTION;
  const authorPrefix = normalizeText(authorName) ? `Escrito por: ${normalizeText(authorName)}. ` : '';
  return truncateText(`${authorPrefix}${descriptionSource}`, 200);
}

function getPostParagraphs(content: ContentBlock[] = [], limit = 3) {
  return content
    .filter((block) => block.type === 'paragraph' && normalizeText(block.value))
    .map((block) => normalizeText(block.value))
    .slice(0, limit);
}

function buildDefaultAppHtml() {
  return '<div id="root"></div>';
}

function buildSeoShareLinks(title: string, canonicalUrl: string) {
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(canonicalUrl);

  return [
    {
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      label: 'Compartir en WhatsApp',
    },
    {
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      label: 'Compartir en Facebook',
    },
    {
      href: `https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      label: 'Compartir en X',
    },
    {
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      label: 'Compartir en LinkedIn',
    },
  ];
}

function buildBlogSeoAppHtml(post: any, description: string, relatedPosts: Array<{ slug: string; title: string }>) {
  const canonicalUrlRaw = toCanonicalUrl(`/blog/${post.slug}`);
  const canonicalUrl = escapeHtml(canonicalUrlRaw);
  const title = escapeHtml(post.title || DEFAULT_TITLE);
  const authorName = escapeHtml(normalizeText((post.author as { name?: string } | undefined)?.name) || 'Avancemos Por Chile');
  const authorId = normalizeText(String((post.author as { _id?: string } | undefined)?._id || ''));
  const publishedDate = post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt);
  const publishedDateLabel = Number.isNaN(publishedDate.getTime())
    ? ''
    : publishedDate.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
  const paragraphs = getPostParagraphs(post.content as ContentBlock[]);
  const paragraphsHtml = paragraphs.length > 0
    ? paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n')
    : `<p>${escapeHtml(description)}</p>`;
  const authorLinkHtml = authorId
    ? `<a href="/u/${escapeHtml(authorId)}">${authorName}</a>`
    : authorName;
  const relatedLinks = [
    { href: '/blog', label: 'Ver todas las publicaciones' },
    ...relatedPosts.map((relatedPost) => ({
      href: `/blog/${relatedPost.slug}`,
      label: relatedPost.title,
    })),
  ];

  const relatedLinksHtml = relatedLinks
    .map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`)
    .join('\n');
  const shareLinksHtml = buildSeoShareLinks(post.title || DEFAULT_TITLE, canonicalUrlRaw)
    .map((link) => `<li><a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a></li>`)
    .join('\n');

  return `<div id="root"><article data-seo-preview="blog-post" style="max-width:960px;margin:0 auto;padding:32px 20px 56px;color:#16324f;font-family:Georgia, 'Times New Roman', serif;line-height:1.65;">
    <nav aria-label="Migas de pan" style="font-family:Arial, sans-serif;font-size:14px;margin-bottom:18px;">
      <a href="/">Inicio</a> / <a href="/blog">Blog</a> / <span>${title}</span>
    </nav>
    <header>
      <p style="font-family:Arial, sans-serif;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#c22a2a;margin:0 0 12px;">Artículo del blog</p>
      <h1 style="font-size:clamp(2rem,4vw,3.5rem);line-height:1.15;margin:0 0 16px;">${title}</h1>
      <p style="font-family:Arial, sans-serif;font-size:15px;color:#4b5563;margin:0 0 24px;">Publicado ${escapeHtml(publishedDateLabel)}${publishedDateLabel ? ' · ' : ''}Por ${authorLinkHtml}</p>
    </header>
    <section aria-labelledby="resumen-del-articulo">
      <h2 id="resumen-del-articulo" style="font-size:1.5rem;margin:0 0 14px;">Resumen del artículo</h2>
      ${paragraphsHtml}
    </section>
    <section aria-labelledby="leer-articulo-completo" style="margin-top:32px;">
      <h2 id="leer-articulo-completo" style="font-size:1.5rem;margin:0 0 14px;">Leer artículo completo</h2>
      <p>Abre la versión interactiva de esta publicación para ver imágenes, documentos y opciones de compartir.</p>
      <p><a href="${canonicalUrl}">Ir al artículo completo</a></p>
    </section>
    <section aria-labelledby="compartir-publicacion" style="margin-top:32px;">
      <h2 id="compartir-publicacion" style="font-size:1.5rem;margin:0 0 14px;">Compartir esta publicación</h2>
      <p>Difunde este contenido en redes sociales con los siguientes accesos directos:</p>
      <ul style="padding-left:20px;">
        ${shareLinksHtml}
      </ul>
    </section>
    <section aria-labelledby="enlaces-relacionados" style="margin-top:32px;">
      <h2 id="enlaces-relacionados" style="font-size:1.5rem;margin:0 0 14px;">Enlaces relacionados</h2>
      <ul style="padding-left:20px;">
        ${relatedLinksHtml}
      </ul>
    </section>
  </article></div>`;
}

function buildMetaBlock(meta: MetaPayload) {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const canonicalUrl = escapeHtml(meta.canonicalUrl);
  const imageUrl = escapeHtml(meta.imageUrl);
  const twitterImageUrl = escapeHtml(meta.twitterImageUrl);
  const imageAlt = escapeHtml(meta.imageAlt);
  const authorName = meta.authorName ? escapeHtml(meta.authorName) : '';

  return `<!--app-meta-start-->
    <title>${title}</title>
    <link rel="icon" href="/isotipo-avancemosporchile.png" />
    <meta name="description" content="${description}" />
    <meta name="author" content="Avancemos Por Chile" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${canonicalUrl}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:locale" content="es_CL" />
    <meta property="og:type" content="${meta.ogType}" />
    <meta property="og:site_name" content="Avancemos Por Chile" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:secure_url" content="${imageUrl}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${imageAlt}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${twitterImageUrl}" />
    <meta name="twitter:image:alt" content="${imageAlt}" />
    <meta name="twitter:url" content="${canonicalUrl}" />
${meta.publishedTime ? `    <meta property="article:published_time" content="${escapeHtml(meta.publishedTime)}" />\n` : ''}${authorName ? `    <meta property="article:author" content="${authorName}" />\n` : ''}    <!--app-meta-end-->`;
}

async function getRenderPayloadForRequest(requestPath: string): Promise<RenderPayload> {
  const defaultMeta: MetaPayload = {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    canonicalUrl: toCanonicalUrl(requestPath),
    imageUrl: DEFAULT_IMAGE,
    twitterImageUrl: DEFAULT_IMAGE,
    imageAlt: DEFAULT_TITLE,
    ogType: 'website',
  };
  const defaultPayload: RenderPayload = {
    meta: defaultMeta,
    appHtml: buildDefaultAppHtml(),
  };

  const blogMatch = requestPath.match(/^\/blog\/([^/]+)\/?$/);
  if (!blogMatch) {
    return defaultPayload;
  }

  const slug = decodeURIComponent(blogMatch[1]);
  console.info('[meta] Resolving blog metadata', {
    requestPath,
    slug,
  });

  const post = await Post.findOne({ slug, status: 'published' }).populate('author', 'name');
  if (!post) {
    console.warn('[meta] Published post not found for metadata', {
      requestPath,
      slug,
    });
    return defaultPayload;
  }

  const resolvedImageUrl = toAbsoluteAssetUrl(post.bannerImage);
  const resolvedShareImageUrl = toAbsoluteAssetUrl(post.bannerImageToShare || post.bannerImage);
  const resolvedTwitterImageUrl = toAbsoluteAssetUrl(post.bannerImageToShareX || post.bannerImageToShare || post.bannerImage);
  const normalizedBannerImage = normalizeText(post.bannerImage || undefined);
  const isUsingDefaultImage = resolvedImageUrl === DEFAULT_IMAGE;

  console.info('[meta] Blog metadata resolved', {
    slug,
    postId: String(post._id),
    title: post.title,
    rawBannerImage: normalizedBannerImage || null,
    resolvedImageUrl,
    resolvedShareImageUrl,
    resolvedTwitterImageUrl,
    isUsingDefaultImage,
  });

  if (!normalizedBannerImage) {
    console.warn('[meta] Post has no bannerImage for metadata', {
      slug,
      postId: String(post._id),
      title: post.title,
    });
  } else if (isUsingDefaultImage) {
    console.warn('[meta] bannerImage fell back to default image', {
      slug,
      postId: String(post._id),
      title: post.title,
      rawBannerImage: normalizedBannerImage,
    });
  }

  const description = getPostDescription(post.content as ContentBlock[], (post.author as { name?: string } | undefined)?.name);
  const relatedPosts = await Post.find({ status: 'published', _id: { $ne: post._id } })
    .select('slug title')
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

  return {
    meta: {
      title: `${post.title} | Avancemos Por Chile`,
      description,
      canonicalUrl: toCanonicalUrl(`/blog/${post.slug}`),
      imageUrl: resolvedShareImageUrl,
      twitterImageUrl: resolvedTwitterImageUrl,
      imageAlt: post.title,
      ogType: 'article',
      publishedTime: post.createdAt?.toISOString?.() || undefined,
      authorName: (post.author as { name?: string } | undefined)?.name,
    },
    appHtml: buildBlogSeoAppHtml(post, description, relatedPosts),
  };
}

export async function renderAppHtml(distPath: string, requestPath: string) {
  const indexFilePath = path.join(distPath, 'index.html');
  const [template, payload] = await Promise.all([
    fs.readFile(indexFilePath, 'utf-8'),
    getRenderPayloadForRequest(requestPath),
  ]);

  const sanitizedTemplate = template.replace(/\s*<!-- Twitter -->[\s\S]*?(?=\s*<!-- Structured data -->)/i, '\n');

  return sanitizedTemplate
    .replace(/<!--app-meta-start-->[\s\S]*?<!--app-meta-end-->/, buildMetaBlock(payload.meta))
    .replace(/<div id="root"><\/div>/, payload.appHtml);
}