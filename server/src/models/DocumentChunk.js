import mongoose from 'mongoose';

const documentChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      default: [],
      select: true,
    },
    lawNumber: {
      type: Number,
      min: 1,
      max: 42,
      default: null,
      index: true,
    },
    lawTitle: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    clauseNumber: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    pageStart: {
      type: Number,
      default: 1,
    },
    pageEnd: {
      type: Number,
      default: 1,
    },
    sectionHeading: {
      type: String,
      trim: true,
      default: '',
    },
    documentVersion: {
      type: String,
      trim: true,
      default: '',
    },
    issuingOrganisation: {
      type: String,
      enum: ['MCC', 'ICC', 'BCCI', 'ECB', 'CA', 'OTHER'],
      default: 'MCC',
      index: true,
    },
    applicableFormats: {
      type: [String],
      default: ['ALL'],
      index: true,
    },
    applicableCompetitions: {
      type: [String],
      default: [],
      index: true,
    },
    effectiveFrom: {
      type: Date,
      default: null,
    },
    effectiveTo: {
      type: Date,
      default: null,
    },
    contentHash: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique document chunk identity
documentChunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });

// Text index on text, lawTitle, sectionHeading, and clauseNumber for lexical search fallback
documentChunkSchema.index({
  text: 'text',
  lawTitle: 'text',
  sectionHeading: 'text',
  clauseNumber: 'text',
});

// Filtering index for quick retrieval
documentChunkSchema.index({ lawNumber: 1, clauseNumber: 1, issuingOrganisation: 1 });

const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema);
export default DocumentChunk;
