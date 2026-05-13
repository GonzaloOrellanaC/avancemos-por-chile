import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Roles: admin, editor, columnista, project_admin and usuario (public)
  role: { type: String, enum: ['admin', 'editor', 'columnista', 'project_admin', 'usuario'], default: 'usuario' },
  // Profile fields for public author pages
  profileImage: { type: String },
  shortDescription: { type: String },
  longDescription: { type: String },
  isPublicProfile: { type: Boolean, default: false },
  // Flag to indicate enrollment for project submissions
  isEnrolled: { type: Boolean, default: false },
  // Enrollment metadata
  enrollmentRequestedAt: Date,
  enrolledAt: Date,
  enrolledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  documentId: String,
  phone: String,
  organization: String,
  enrollmentNotes: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { timestamps: true });

userSchema.pre('save', async function(this: any) {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(this: any, candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
