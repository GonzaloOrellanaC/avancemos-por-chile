import mongoose from 'mongoose';

const postHistorySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['created', 'updated', 'submitted_for_review', 'changes_requested', 'resubmitted_for_review', 'published', 'moved_to_draft'],
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'in_review', 'changes_requested', 'published'],
    required: true,
  },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorRole: { type: String, enum: ['admin', 'editor', 'columnista'], required: true },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

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
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  status: { type: String, enum: ['draft', 'in_review', 'changes_requested', 'published'], default: 'draft' },
  history: { type: [postHistorySchema], default: [] },
}, { timestamps: true });

export const Post = mongoose.model('Post', postSchema);
