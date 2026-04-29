import mongoose from 'mongoose';

const geoVisitMetricSchema = new mongoose.Schema({
  resourceKey: { type: String, required: true, index: true },
  countryCode: { type: String, required: true },
  countryName: { type: String, required: true },
  viewCount: { type: Number, default: 0 },
  lastSeenAt: { type: Date, default: Date.now },
}, { timestamps: true });

geoVisitMetricSchema.index({ resourceKey: 1, countryCode: 1 }, { unique: true });

export const GeoVisitMetric = mongoose.model('GeoVisitMetric', geoVisitMetricSchema);