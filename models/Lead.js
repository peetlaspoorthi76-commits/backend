import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  company: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
  phone: { type: String, trim: true },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Meeting Scheduled', 'Proposal Sent', 'Won', 'Lost'],
    default: 'New'
  },
  source: {
    type: String,
    enum: ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Email Campaign', 'Other'],
    default: 'Website'
  },
  value: { type: Number, default: 0, min: 0 },
  notes: { type: String, maxlength: 1000 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual field for lead age
leadSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Indexes for performance
leadSchema.index({ owner: 1, status: 1 });
leadSchema.index({ owner: 1, source: 1 });
leadSchema.index({ owner: 1, createdAt: -1 });
leadSchema.index({ email: 1 });

const Lead = mongoose.model('Lead', leadSchema);
export default Lead;
