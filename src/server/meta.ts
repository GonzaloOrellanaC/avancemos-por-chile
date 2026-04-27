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
  imageAlt: string;
  ogType: 'website' | 'article';
  publishedTime?: string;
  authorName?: string;
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

function buildMetaBlock(meta: MetaPayload) {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const canonicalUrl = escapeHtml(meta.canonicalUrl);
  const imageUrl = escapeHtml(meta.imageUrl);
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
    <meta property="og:image:alt" content="${imageAlt}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="twitter:url" content="${canonicalUrl}" />
${meta.publishedTime ? `    <meta property="article:published_time" content="${escapeHtml(meta.publishedTime)}" />\n` : ''}${authorName ? `    <meta property="article:author" content="${authorName}" />\n` : ''}    <!--app-meta-end-->`;
}

async function getMetaForRequest(requestPath: string): Promise<MetaPayload> {
  const defaultMeta: MetaPayload = {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    canonicalUrl: toCanonicalUrl(requestPath),
    imageUrl: DEFAULT_IMAGE,
    imageAlt: DEFAULT_TITLE,
    ogType: 'website',
  };

  const blogMatch = requestPath.match(/^\/blog\/([^/]+)\/?$/);
  if (!blogMatch) {
    return defaultMeta;
  }

  const slug = decodeURIComponent(blogMatch[1]);
  const post = await Post.findOne({ slug, status: 'published' }).populate('author', 'name');
  if (!post) {
    return defaultMeta;
  }

  return {
    title: `${post.title} | Avancemos Por Chile`,
    description: getPostDescription(post.content as ContentBlock[], (post.author as { name?: string } | undefined)?.name),
    canonicalUrl: toCanonicalUrl(`/blog/${post.slug}`),
    imageUrl: toAbsoluteAssetUrl(post.bannerImage),
    imageAlt: post.title,
    ogType: 'article',
    publishedTime: post.createdAt?.toISOString?.() || undefined,
    authorName: (post.author as { name?: string } | undefined)?.name,
  };
}

export async function renderAppHtml(distPath: string, requestPath: string) {
  const indexFilePath = path.join(distPath, 'index.html');
  const [template, meta] = await Promise.all([
    fs.readFile(indexFilePath, 'utf-8'),
    getMetaForRequest(requestPath),
  ]);

  return template.replace(/<!--app-meta-start-->[\s\S]*?<!--app-meta-end-->/, buildMetaBlock(meta));
}