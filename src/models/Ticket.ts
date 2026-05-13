import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  body: String,
  files: [{ originalName: String, storagePath: String, mimeType: String, size: Number }],
}, { timestamps: true });

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  files: [{ originalName: String, storagePath: String, mimeType: String, size: Number }],
  submitter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submitterEmail: { type: String },
  status: { type: String, enum: ['open','pending','closed'], default: 'open' },
  replies: [replySchema],
}, { timestamps: true });

export const Ticket = mongoose.model('Ticket', ticketSchema);
