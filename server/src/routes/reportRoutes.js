import { Router } from 'express';
import { createReport, getReports, updateReportStatus } from '../controllers/reportController.js';

const router = Router();

// Public route to submit bug / law discrepancy
router.post('/', createReport);

// Listing and updating reports
router.get('/', getReports);
router.patch('/:id/status', updateReportStatus);

export default router;
