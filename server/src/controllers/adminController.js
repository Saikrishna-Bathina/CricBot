import Document from '../models/Document.js';
import DocumentChunk from '../models/DocumentChunk.js';
import IngestionJob from '../models/IngestionJob.js';
import AuditLog from '../models/AuditLog.js';
import { documentAdminService } from '../services/ingestion/documentAdminService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function registerDocument(req, res, next) {
  try {
    const {
      title,
      issuingOrganisation,
      documentType,
      version,
      edition,
      sourceUrl,
      publishedAt,
      effectiveFrom,
      applicableFormats,
      applicableCompetitions,
    } = req.body;

    if (!title || !version) {
      return next(new AppError('Title and version/edition are required.', 400, 'VALIDATION_ERROR'));
    }

    const doc = await documentAdminService.registerDocument(
      {
        title,
        issuingOrganisation,
        documentType,
        version,
        edition,
        sourceUrl,
        publishedAt,
        effectiveFrom,
        applicableFormats,
        applicableCompetitions,
      },
      req.user._id
    );

    res.status(201).json({
      success: true,
      data: doc,
    });
  } catch (err) {
    next(err);
  }
}

export async function listDocuments(req, res, next) {
  try {
    const { status, issuingOrganisation } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (issuingOrganisation) filter.issuingOrganisation = issuingOrganisation;

    const documents = await Document.find(filter).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (err) {
    next(err);
  }
}

export async function getDocumentById(req, res, next) {
  try {
    const { documentId } = req.params;
    const document = await Document.findById(documentId).lean();

    if (!document) {
      return next(new AppError('Document not found', 404, 'NOT_FOUND'));
    }

    const chunks = await DocumentChunk.find({ documentId })
      .select('chunkIndex lawNumber lawTitle clauseNumber sectionHeading text pageStart pageEnd')
      .sort({ chunkIndex: 1 })
      .limit(100)
      .lean();

    const jobs = await IngestionJob.find({ documentId }).sort({ createdAt: -1 }).limit(5).lean();

    res.status(200).json({
      success: true,
      data: {
        document,
        chunks,
        jobs,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function ingestDocument(req, res, next) {
  try {
    const { documentId } = req.params;
    const rawTextContent = req.body.rawTextContent;
    const fileBuffer = req.file ? req.file.buffer : null;

    if (!fileBuffer && !rawTextContent) {
      return next(new AppError('Either a PDF upload or rawTextContent is required to start ingestion.', 400, 'VALIDATION_ERROR'));
    }

    const job = await documentAdminService.startIngestionJob(
      documentId,
      fileBuffer,
      rawTextContent,
      req.user._id
    );

    res.status(202).json({
      success: true,
      message: 'Ingestion job queued and started.',
      data: job,
    });
  } catch (err) {
    next(err);
  }
}

export async function getIngestionJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const job = await IngestionJob.findById(jobId).lean();

    if (!job) {
      return next(new AppError('Ingestion job not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (err) {
    next(err);
  }
}

export async function publishDocument(req, res, next) {
  try {
    const { documentId } = req.params;
    const doc = await documentAdminService.publishDocument(documentId, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Document successfully published to production knowledge base.',
      data: doc,
    });
  } catch (err) {
    next(err);
  }
}

export async function supersedeDocument(req, res, next) {
  try {
    const { documentId } = req.params;
    const { supersedingDocumentId } = req.body;

    const doc = await documentAdminService.supersedeDocument(
      documentId,
      supersedingDocumentId,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: 'Document marked as superseded.',
      data: doc,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const logs = await AuditLog.find().populate('actorId', 'name email role').sort({ createdAt: -1 }).limit(50).lean();

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
}
