import { checkDatabaseHealth } from '../config/database.js';
import { env } from '../config/env.js';

export function getLiveness(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'ai-cricket-laws-assistant-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
}

export function getReadiness(req, res) {
  const dbHealth = checkDatabaseHealth();
  const isReady = dbHealth.status === 'ok';

  const readinessInfo = {
    status: isReady ? 'ok' : 'degraded',
    service: 'ai-cricket-laws-assistant-api',
    timestamp: new Date().toISOString(),
    dependencies: {
      database: dbHealth,
      llmProvider: {
        configured: Boolean(env.LLM_API_KEY) || env.LLM_PROVIDER === 'mock',
        provider: env.LLM_PROVIDER,
        model: env.LLM_MODEL
      },
      embeddingProvider: {
        configured: Boolean(env.EMBEDDING_API_KEY) || env.EMBEDDING_PROVIDER === 'local',
        provider: env.EMBEDDING_PROVIDER,
        dimensions: env.EMBEDDING_DIMENSIONS
      }
    }
  };

  const statusCode = isReady ? 200 : 503;
  res.status(statusCode).json(readinessInfo);
}
