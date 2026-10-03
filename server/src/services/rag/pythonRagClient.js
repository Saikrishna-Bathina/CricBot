import { env } from '../../config/env.js';
import crypto from 'crypto';

/**
 * HTTP Client adapter connecting Express to the FastAPI Python RAG microservice.
 */
export class PythonRAGClient {
  constructor() {
    this.baseUrl = process.env.PYTHON_RAG_SERVICE_URL || 'http://127.0.0.1:8000';
    this.timeoutMs = parseInt(process.env.PYTHON_RAG_TIMEOUT_MS || '15000', 10);
    this.enabled = process.env.USE_PYTHON_RAG === 'true';
  }

  isEnabled() {
    return this.enabled;
  }

  /**
   * Proxies question answering to FastAPI POST /answer
   */
  async answerQuestion({ query, format = 'All', competition = 'All', correlationId = null }) {
    const traceId = correlationId || crypto.randomUUID();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': traceId,
        },
        body: JSON.stringify({
          query,
          format: format || 'All',
          competition: competition || 'All',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Python RAG service HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return {
        success: true,
        traceId,
        data,
      };
    } catch (err) {
      console.warn(`[PythonRAGClient] Failed to query Python RAG service (${err.message}). Engaging fallback.`);
      return {
        success: false,
        error: err.message,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Proxies scenario analysis to FastAPI POST /scenarios/analyze
   */
  async analyzeScenario({ scenario, format = 'All', competition = 'All', correlationId = null }) {
    const traceId = correlationId || crypto.randomUUID();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/scenarios/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': traceId,
        },
        body: JSON.stringify({
          scenario,
          format: format || 'All',
          competition: competition || 'All',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Python RAG service HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return {
        success: true,
        traceId,
        data,
      };
    } catch (err) {
      console.warn(`[PythonRAGClient] Failed to query scenario from Python RAG (${err.message}). Engaging fallback.`);
      return {
        success: false,
        error: err.message,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Health probe for the Python RAG service
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const pythonRagClient = new PythonRAGClient();
