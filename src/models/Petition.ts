import mongoose from 'mongoose';

const signatureSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  // RUT normalizado (ej: 12345678K) — identificador único por persona.
  rut: { type: String, required: true, trim: true, uppercase: true },
  email: { type: String, trim: true, lowercase: true },
  comuna: { type: String, trim: true },
  comment: { type: String, trim: true },
  // Auditoría: origen de la firma.
  ip: { type: String },
  userAgent: { type: String },
  submitter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const petitionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  // Slug en formato URL: espacios → guiones, ñ → n, sin símbolos.
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
  summary: { type: String, trim: true },
  bannerImage: { type: String },
  // Enlaces de video para mostrar junto a la iniciativa.
  youtubeUrl: { type: String, trim: true },
  tiktokUrl: { type: String, trim: true },
  // Meta de firmas objetivo (0 = sin meta definida).
  goal: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
  // Contador desnormalizado de firmas.
  signatureCount: { type: Number, default: 0 },
  // RUTs usados para evitar firmas duplicadas por persona (dedup atómico).
  signatureRuts: { type: [String], default: [] },
  // Emails usados (información complementaria de dedup).
  signatureEmails: { type: [String], default: [] },
  signatures: { type: [signatureSchema], default: [] },
  content: [{
    type: { type: String, enum: ['paragraph', 'image', 'pdf'], required: true },
    value: { type: String, required: true },
    caption: { type: String },
  }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Petition = mongoose.model('Petition', petitionSchema);
