import { lawSearchService } from '../services/retrieval/lawSearchService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function searchLaws(req, res, next) {
  try {
    const { q, lawNumber, clauseNumber, issuingOrganisation, format, page, limit } = req.query;

    const result = await lawSearchService.searchLaws({
      q: q || '',
      lawNumber: lawNumber || null,
      clauseNumber: clauseNumber || null,
      issuingOrganisation: issuingOrganisation || null,
      format: format || null,
      page: page || 1,
      limit: limit || 10,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getSourceDetails(req, res, next) {
  try {
    const { sourceId } = req.params;
    const result = await lawSearchService.getSourceDetails(sourceId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
