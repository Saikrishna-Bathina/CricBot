import { Report } from '../models/Report.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendDiscrepancyReportEmail, DEVELOPER_RECIPIENT_EMAIL } from '../services/emailService.js';

export async function createReport(req, res, next) {
  try {
    const { category, lawReference, description, proofEvidence, userEmail } = req.body;

    if (!description || !description.trim()) {
      return next(new AppError('A clear description of the error or bug is required.', 400, 'VALIDATION_ERROR'));
    }

    if (!proofEvidence || !proofEvidence.trim()) {
      return next(new AppError('Supporting proof or rulebook citations are required.', 400, 'VALIDATION_ERROR'));
    }

    const report = await Report.create({
      category: category || 'law-discrepancy',
      lawReference: lawReference ? lawReference.trim() : '',
      description: description.trim(),
      proofEvidence: proofEvidence.trim(),
      userEmail: userEmail ? userEmail.trim() : '',
    });

    // Attempt to dispatch email to developer
    const emailResult = await sendDiscrepancyReportEmail(report);

    res.status(201).json({
      success: true,
      message: 'Discrepancy report recorded successfully. Thank you for upholding cricket law accuracy.',
      data: report,
      emailStatus: {
        developerRecipient: DEVELOPER_RECIPIENT_EMAIL,
        ...emailResult,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getReports(req, res, next) {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).limit(100);

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateReportStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return next(new AppError('Report not found', 404, 'NOT_FOUND'));
    }

    if (status) report.status = status;
    if (adminNotes !== undefined) report.adminNotes = adminNotes;

    await report.save();

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
}
