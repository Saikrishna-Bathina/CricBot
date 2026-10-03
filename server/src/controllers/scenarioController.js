import { scenarioService } from '../services/scenarios/scenarioService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function analyzeMatchScenario(req, res, next) {
  try {
    const { scenario, format, competition, matchDate } = req.body;

    if (!scenario || typeof scenario !== 'string' || !scenario.trim()) {
      return next(new AppError('A valid scenario description is required.', 400, 'VALIDATION_ERROR'));
    }

    const result = await scenarioService.analyzeScenario({
      scenarioText: scenario,
      format: format || 'ALL',
      competition: competition || 'ALL',
      matchDate: matchDate || null,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
