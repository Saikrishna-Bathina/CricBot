import mongoose from 'mongoose';

const ingestionJobSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    currentStage: {
      type: String,
      enum: ['queued', 'extraction', 'chunking', 'embedding', 'indexing', 'validation', 'finished'],
      default: 'queued',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    processedPages: {
      type: Number,
      default: 0,
    },
    generatedChunks: {
      type: Number,
      default: 0,
    },
    errorSummary: {
      type: String,
      default: '',
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const IngestionJob = mongoose.model('IngestionJob', ingestionJobSchema);
export default IngestionJob;
