import 'dotenv/config';
import { connectDB } from './src/lib/db.ts';
import { Post } from './src/models/Post.ts';
import { generateShareImagesForBanner } from './src/lib/shareImages.ts';

async function run() {
  await connectDB();

  const posts = await Post.find({
    bannerImage: { $exists: true, $ne: null },
    $or: [
      { bannerImageToShare: { $exists: false } },
      { bannerImageToShare: null },
      { bannerImageToShareX: { $exists: false } },
      { bannerImageToShareX: null },
    ],
  }).select('_id slug title bannerImage');

  console.info(`[share-images] Posts pendientes: ${posts.length}`);

  for (const post of posts) {
    try {
      const shareImages = await generateShareImagesForBanner(post.slug, post.bannerImage);
      post.bannerImageToShare = shareImages.bannerImageToShare || post.bannerImageToShare;
      post.bannerImageToShareX = shareImages.bannerImageToShareX || post.bannerImageToShareX;
      await post.save();
      console.info('[share-images] OK', {
        postId: String(post._id),
        slug: post.slug,
      });
    } catch (error) {
      console.warn('[share-images] Error regenerating share images', {
        postId: String(post._id),
        slug: post.slug,
        error,
      });
    }
  }
}

run()
  .then(() => {
    console.info('[share-images] Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[share-images] Error fatal', error);
    process.exit(1);
  });