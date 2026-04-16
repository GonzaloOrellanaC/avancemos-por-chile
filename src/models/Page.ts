import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  isHome: { type: Boolean, default: false },
  hero: {
    images: [{ url: String, animation: String }],
    duration: { type: Number, default: 6000 },
    overlayOpacity: { type: Number, default: 0.6 }
  },
  sections: [{
    type: { type: String, enum: ['cards', 'custom'], default: 'custom' },
    layout: { type: String, enum: ['1', '2', '3', '4'], default: '1' },
    columns: [{
      title: String,
      icon: String,
      content: [{
        type: { type: String, enum: ['title', 'subtitle', 'text', 'image', 'video', 'youtube'], required: true },
        value: { type: String, required: true },
        align: { type: String, enum: ['left', 'center', 'right', 'justify'], default: 'left' }
      }]
    }]
  }],
  status: { type: String, enum: ['draft', 'published'], default: 'published' }
}, { timestamps: true });

export const Page = mongoose.model('Page', pageSchema);
