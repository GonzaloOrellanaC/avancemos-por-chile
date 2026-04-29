import mongoose from 'mongoose';

const siteMetricSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  viewCount: { type: Number, default: 0 },
}, { timestamps: true });

export const SiteMetric = mongoose.model('SiteMetric', siteMetricSchema);