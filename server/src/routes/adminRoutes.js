import express from 'express';
import multer from 'multer';
import {
  registerDocument,
  listDocuments,
  getDocumentById,
  ingestDocument,
  getIngestionJob,
  publishDocument,
  supersedeDocument,
  getAuditLogs,
} from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

const router = express.Router();

// Apply auth and admin check to all admin routes
router.use(requireAuth, requireAdmin);

router.post('/documents', registerDocument);
router.get('/documents', listDocuments);
router.get('/documents/:documentId', getDocumentById);
router.post('/documents/:documentId/ingest', upload.single('file'), ingestDocument);
router.get('/ingestion-jobs/:jobId', getIngestionJob);
router.post('/documents/:documentId/publish', publishDocument);
router.post('/documents/:documentId/supersede', supersedeDocument);
router.get('/audit-logs', getAuditLogs);

export default router;
