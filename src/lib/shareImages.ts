import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

type ShareImageResult = {
  bannerImageToShare?: string;
  bannerImageToShareX?: string;
};

type SourceImage = {
  buffer: Buffer;
  extension: string;
};

function normalizeAssetUrl(assetUrl?: string | null) {
  return (assetUrl || '').trim().replace(/\\/g, '/');
}

async function readSourceImage(assetUrl?: string | null): Promise<SourceImage | null> {
  const normalizedAssetUrl = normalizeAssetUrl(assetUrl);
  if (!normalizedAssetUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(normalizedAssetUrl)) {
    const response = await fetch(normalizedAssetUrl);
    if (!response.ok) {
      throw new Error(`No se pudo descargar la imagen remota (${response.status})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || '';
    const extension = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg';

    return {
      buffer: Buffer.from(arrayBuffer),
      extension,
    };
  }

  const relativeAssetPath = normalizedAssetUrl.startsWith('/') ? normalizedAssetUrl.slice(1) : normalizedAssetUrl;
  const absoluteAssetPath = path.join(process.cwd(), relativeAssetPath);
  const buffer = await fs.readFile(absoluteAssetPath);

  return {
    buffer,
    extension: path.extname(relativeAssetPath) || '.jpg',
  };
}

function buildOutputBaseName(slug: string, extension: string) {
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'post';
  return `${safeSlug}-${Date.now()}${extension}`;
}

async function createVariant(buffer: Buffer, outputPath: string, width: number, height: number) {
  await sharp(buffer)
    .rotate()
    .resize({
      width,
      height,
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 76, mozjpeg: true })
    .toFile(outputPath);
}

export async function generateShareImagesForBanner(slug: string, bannerImage?: string | null): Promise<ShareImageResult> {
  const sourceImage = await readSourceImage(bannerImage);
  if (!sourceImage) {
    return {};
  }

  const outputDirectory = path.join(process.cwd(), 'uploads', 'social');
  await fs.mkdir(outputDirectory, { recursive: true });

  const outputBaseName = buildOutputBaseName(slug, sourceImage.extension);
  const genericFileName = outputBaseName.replace(sourceImage.extension, '-share.jpg');
  const twitterFileName = outputBaseName.replace(sourceImage.extension, '-share-x.jpg');
  const genericOutputPath = path.join(outputDirectory, genericFileName);
  const twitterOutputPath = path.join(outputDirectory, twitterFileName);

  await Promise.all([
    createVariant(sourceImage.buffer, genericOutputPath, 1200, 630),
    createVariant(sourceImage.buffer, twitterOutputPath, 1600, 900),
  ]);

  return {
    bannerImageToShare: `/uploads/social/${genericFileName}`,
    bannerImageToShareX: `/uploads/social/${twitterFileName}`,
  };
}