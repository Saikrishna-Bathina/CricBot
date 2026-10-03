import Document from '../../models/Document.js';
import DocumentChunk from '../../models/DocumentChunk.js';
import IngestionJob from '../../models/IngestionJob.js';
import AuditLog from '../../models/AuditLog.js';
import { chunkCricketDocument } from './chunker.js';
import { extractTextFromPdf } from './pdfExtractor.js';
import { embeddingService } from '../embeddings/embeddingService.js';
import crypto from 'crypto';

export class DocumentAdminService {
  /**
   * Registers a new official document record in 'draft' status.
   */
  async registerDocument(data, userId = null) {
    const document = await Document.create({
      title: data.title,
      issuingOrganisation: data.issuingOrganisation || 'MCC',
      documentType: data.documentType || 'LAWS_OF_CRICKET',
      sourceUrl: data.sourceUrl || '',
      storageKey: data.storageKey || '',
      originalFilename: data.originalFilename || '',
      version: data.version,
      edition: data.edition || '',
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
      applicableFormats: data.applicableFormats || ['ALL'],
      applicableCompetitions: data.applicableCompetitions || [],
      language: data.language || 'en',
      status: 'draft',
      createdBy: userId,
    });

    await AuditLog.create({
      actorId: userId,
      action: 'DOCUMENT_REGISTERED',
      targetType: 'Document',
      targetId: document._id.toString(),
      metadata: { title: document.title, version: document.version },
    });

    return document;
  }

  /**
   * Starts an asynchronous ingestion job for a registered document.
   */
  async startIngestionJob(documentId, fileBuffer = null, rawTextContent = null, userId = null) {
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    const job = await IngestionJob.create({
      documentId: document._id,
      status: 'processing',
      currentStage: 'extraction',
      progress: 10,
      startedAt: new Date(),
    });

    document.status = 'processing';
    await document.save();

    // Process ingestion in background / microtask
    setImmediate(async () => {
      try {
        let extractedText = rawTextContent || '';
        let pageCount = 1;

        if (fileBuffer) {
          job.currentStage = 'extraction';
          job.progress = 25;
          await job.save();

          const pdfResult = await extractTextFromPdf(fileBuffer);
          extractedText = pdfResult.rawText;
          pageCount = pdfResult.numPages;
        }

        // Stage 2: Law-Aware Chunking
        job.currentStage = 'chunking';
        job.progress = 50;
        await job.save();

        const chunks = chunkCricketDocument(extractedText, {
          version: document.version,
          issuingOrganisation: document.issuingOrganisation,
          applicableFormats: document.applicableFormats,
          effectiveFrom: document.effectiveFrom,
        });

        if (chunks.length === 0) {
          throw new Error('No valid law chunks could be extracted from document text.');
        }

        // Stage 3: Embedding Generation
        job.currentStage = 'embedding';
        job.progress = 75;
        await job.save();

        const texts = chunks.map((c) => c.text);
        const embeddings = await embeddingService.getBatchEmbeddings(texts);

        // Stage 4: Chunks persistence
        job.currentStage = 'indexing';
        job.progress = 90;
        await job.save();

        // Remove any old chunks for this document ID before inserting
        await DocumentChunk.deleteMany({ documentId: document._id });

        const chunkRecords = chunks.map((chunk, idx) => ({
          ...chunk,
          documentId: document._id,
          embedding: embeddings[idx] || [],
        }));

        await DocumentChunk.insertMany(chunkRecords);

        // Update Document status to 'review' (ready for admin inspection)
        document.status = 'review';
        document.ingestionMetadata = {
          pageCount,
          chunkCount: chunkRecords.length,
          modelUsed: embeddingService.model,
          processingDurationMs: Date.now() - job.startedAt.getTime(),
        };
        await document.save();

        // Complete Ingestion Job
        job.status = 'completed';
        job.currentStage = 'finished';
        job.progress = 100;
        job.processedPages = pageCount;
        job.generatedChunks = chunkRecords.length;
        job.completedAt = new Date();
        await job.save();

        await AuditLog.create({
          actorId: userId,
          action: 'INGESTION_COMPLETED',
          targetType: 'Document',
          targetId: document._id.toString(),
          metadata: { chunksCreated: chunkRecords.length },
        });
      } catch (err) {
        console.error(`[DocumentAdminService] Ingestion failed for doc ${documentId}:`, err.message);
        job.status = 'failed';
        job.errorSummary = err.message;
        job.completedAt = new Date();
        await job.save();

        document.status = 'failed';
        await document.save();
      }
    });

    return job;
  }

  /**
   * Publishes a document after administrative review.
   */
  async publishDocument(documentId, userId = null) {
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    const chunkCount = await DocumentChunk.countDocuments({ documentId: document._id });
    if (chunkCount === 0) {
      throw new Error('Cannot publish document: No chunks exist. Ingest the document first.');
    }

    document.status = 'published';
    document.reviewedBy = userId;
    await document.save();

    await AuditLog.create({
      actorId: userId,
      action: 'DOCUMENT_PUBLISHED',
      targetType: 'Document',
      targetId: document._id.toString(),
      metadata: { chunkCount },
    });

    return document;
  }

  /**
   * Marks a document as superseded by a newer edition/amendment.
   */
  async supersedeDocument(documentId, supersedingDocumentId = null, userId = null) {
    const document = await Document.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    document.status = 'superseded';
    if (supersedingDocumentId) {
      document.supersedesDocumentId = supersedingDocumentId;
    }
    await document.save();

    await AuditLog.create({
      actorId: userId,
      action: 'DOCUMENT_SUPERSEDED',
      targetType: 'Document',
      targetId: document._id.toString(),
      metadata: { supersedingDocumentId },
    });

    return document;
  }
}

export const documentAdminService = new DocumentAdminService();
