import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['review_submitted', 'changes_requested', 'post_published'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  readAt: { type: Date, default: null },
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);