import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  bannerImage: { type: String },
  bannerImageToShare: { type: String },
  bannerImageToShareX: { type: String },
  content: [{
    type: { type: String, enum: ['paragraph', 'image', 'pdf'], required: true },
    value: { type: String, required: true },
    caption: { type: String }
  }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
}, { timestamps: true });

export const Post = mongoose.model('Post', postSchema);
