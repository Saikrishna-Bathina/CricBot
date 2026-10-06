import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['law-discrepancy', 'missing-clause', 'software-bug', 'tournament-variation'],
      default: 'law-discrepancy',
      required: true,
    },
    lawReference: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Description of the discrepancy or bug is required'],
      trim: true,
    },
    proofEvidence: {
      type: String,
      required: [true, 'Supporting proof or rulebook citations are required'],
      trim: true,
    },
    userEmail: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'resolved', 'dismissed'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Report = mongoose.model('Report', reportSchema);
