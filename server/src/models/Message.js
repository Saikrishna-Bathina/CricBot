import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema(
  {
    chunkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DocumentChunk',
      required: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: false,
      default: null,
    },
    lawNumber: {
      type: Number,
      default: null,
    },
    lawTitle: {
      type: String,
      default: '',
    },
    clauseNumber: {
      type: String,
      default: '',
    },
    sourceTitle: {
      type: String,
      default: '',
    },
    sourceUrl: {
      type: String,
      default: '',
    },
    pageStart: {
      type: Number,
      default: 1,
    },
    pageEnd: {
      type: Number,
      default: 1,
    },
    verbatimExcerpt: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ['standard', 'scenario_analysis', 'clarification_request', 'unsupported_warning'],
      default: 'standard',
    },
    citations: [citationSchema],
    applicableContext: {
      issuingOrganisation: { type: String, default: 'MCC' },
      format: { type: String, default: 'ALL' },
      edition: { type: String, default: '' },
      effectiveDate: { type: Date, default: null },
      assumptions: [String],
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
