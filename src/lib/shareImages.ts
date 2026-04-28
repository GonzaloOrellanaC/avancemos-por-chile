import fs from 'fs/promises';
import path from 'path';
import { spawnSync } from 'child_process';

type SharpRuntimeModule = {
  default: typeof import('sharp');
};
type JimpModule = typeof import('jimp');

type ShareImageResult = {
  bannerImageToShare?: string;
  bannerImageToShareX?: string;
};

type SourceImage = {
  buffer: Buffer;
  extension: string;
};

let sharpAvailabilityPromise: Promise<boolean> | null = null;
let sharpModulePromise: Promise<SharpRuntimeModule> | null = null;
let jimpModulePromise: Promise<JimpModule> | null = null;
let hasLoggedJimpFallback = false;

async function canUseSharp() {
  if (!sharpAvailabilityPromise) {
    sharpAvailabilityPromise = Promise.resolve().then(() => {
      const probe = spawnSync(
        process.execPath,
        ['-e', "import('sharp').then(() => process.exit(0)).catch(() => process.exit(1))"],
        {
          cwd: process.cwd(),
          stdio: 'ignore',
        },
      );

      return probe.status === 0;
    });
  }

  return sharpAvailabilityPromise;
}

async function loadSharp() {
  const available = await canUseSharp();
  if (!available) {
    throw new Error('sharp no está disponible en este entorno');
  }

  if (!sharpModulePromise) {
    sharpModulePromise = import('sharp') as Promise<SharpRuntimeModule>;
  }

  return sharpModulePromise;
}

async function loadJimp() {
  if (!jimpModulePromise) {
    jimpModulePromise = import('jimp');
  }

  return jimpModulePromise;
}

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
  if (await canUseSharp()) {
    const { default: sharp } = await loadSharp();

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

    return;
  }

  if (!hasLoggedJimpFallback) {
    console.warn('[share-images] sharp no está disponible; usando jimp como fallback');
    hasLoggedJimpFallback = true;
  }

  const { Jimp, JimpMime } = await loadJimp();
  const image = await Jimp.read(buffer);
  image.cover({ w: width, h: height });
  const output = await image.getBuffer(JimpMime.jpeg, { quality: 76 });
  await fs.writeFile(outputPath, output);
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