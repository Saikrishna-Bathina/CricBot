import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      maxlength: 300,
    },
    issuingOrganisation: {
      type: String,
      required: true,
      enum: ['MCC', 'ICC', 'BCCI', 'ECB', 'CA', 'OTHER'],
      default: 'MCC',
      index: true,
    },
    documentType: {
      type: String,
      required: true,
      enum: ['LAWS_OF_CRICKET', 'PLAYING_CONDITIONS', 'TOURNAMENT_REGULATION', 'EXPLANATORY_MEMO'],
      default: 'LAWS_OF_CRICKET',
      index: true,
    },
    sourceUrl: {
      type: String,
      trim: true,
      default: '',
    },
    storageKey: {
      type: String,
      trim: true,
      default: '',
    },
    originalFilename: {
      type: String,
      trim: true,
      default: '',
    },
    version: {
      type: String,
      required: [true, 'Document version or edition is required'],
      trim: true,
      index: true,
    },
    edition: {
      type: String,
      trim: true,
      default: '',
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
      index: true,
    },
    effectiveTo: {
      type: Date,
      default: null,
      index: true,
    },
    applicableFormats: {
      type: [String],
      enum: ['TEST', 'ODI', 'T20I', 'T20', 'THE_HUNDRED', 'ALL', 'FIRST_CLASS', 'LIST_A'],
      default: ['ALL'],
      index: true,
    },
    applicableCompetitions: {
      type: [String],
      default: [],
      index: true,
    },
    language: {
      type: String,
      default: 'en',
    },
    contentHash: {
      type: String,
      trim: true,
      index: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'processing', 'review', 'published', 'failed', 'superseded'],
      default: 'draft',
      index: true,
    },
    supersedesDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
    ingestionMetadata: {
      pageCount: { type: Number, default: 0 },
      chunkCount: { type: Number, default: 0 },
      processingDurationMs: { type: Number, default: 0 },
      lawCount: { type: Number, default: 0 },
      modelUsed: { type: String, default: '' },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for quick document retrieval by status and applicability
documentSchema.index({ status: 1, issuingOrganisation: 1, effectiveFrom: -1 });

const Document = mongoose.model('Document', documentSchema);
export default Document;
