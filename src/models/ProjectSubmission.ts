import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  mimeType: String,
  size: Number,
  storagePath: String,
});

const projectSubmissionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  submitterName: { type: String },
  submitter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submitterEmail: { type: String },
  files: [fileSchema],
  ip: String,
  userAgent: String,
  status: { type: String, enum: ['submitted', 'under_review', 'approved', 'rejected'], default: 'submitted' },
  riskScore: { type: Number, default: 0 },
  jobId: String,
  meta: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

export const ProjectSubmission = mongoose.model('ProjectSubmission', projectSubmissionSchema);
