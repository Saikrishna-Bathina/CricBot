import { env } from '../../config/env.js';
import crypto from 'crypto';

/**
 * Generates a deterministic normalized embedding vector of specified dimensions.
 * Used for offline development, integration tests, or when API keys are not configured.
 */
function generateLocalVector(text, dimensions = 768) {
  const vector = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return vector;
  }

  const commonStopWords = new Set([
    'the', 'is', 'a', 'an', 'in', 'to', 'of', 'and', 'if', 'it', 'or', 'on', 'at', 'by', 'as', 'for', 'be', 'this', 'that', 'with', 'from', 'shall'
  ]);

  // 1. Hash word tokens (downweight stop words)
  for (const word of words) {
    const isStop = commonStopWords.has(word);
    const weight = isStop ? 0.05 : 1.0;
    const hash = crypto.createHash('sha256').update(`w_${word}`).digest();

    for (let j = 0; j < 6; j++) {
      const idx = hash.readUInt16BE(j * 2) % dimensions;
      const binSign = (hash[j] % 2 === 0) ? 1 : -1;
      vector[idx] += binSign * weight * (hash[j] / 255.0);
    }

    // 2. Character 3-grams for subword matching (e.g. wicketkeeper vs wicket-keeper)
    if (!isStop && word.length >= 4) {
      for (let k = 0; k <= word.length - 3; k++) {
        const tri = word.slice(k, k + 3);
        const triHash = crypto.createHash('md5').update(`t_${tri}`).digest();
        const triIdx = triHash.readUInt16BE(0) % dimensions;
        vector[triIdx] += 0.2;
      }
    }
  }

  // L2 Normalization
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] = parseFloat((vector[i] / norm).toFixed(6));
    }
  }

  return vector;
}

/**
 * Configurable embedding service supporting Gemini, OpenAI, and Local deterministic provider.
 */
export class EmbeddingService {
  constructor() {
    this.provider = env.EMBEDDING_PROVIDER;
    this.apiKey = env.EMBEDDING_API_KEY || env.LLM_API_KEY;
    this.model = env.EMBEDDING_MODEL;
    this.dimensions = env.EMBEDDING_DIMENSIONS;
  }

  /**
   * Generates embedding for a single text query.
   */
  async getEmbedding(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required to generate embedding');
    }

    if (this.provider === 'openai' && this.apiKey) {
      return this._getOpenAIEmbedding(text);
    }

    if (this.provider === 'gemini' && this.apiKey) {
      return this._getGeminiEmbedding(text);
    }

    // Default to high-fidelity local vector generator
    return generateLocalVector(text, this.dimensions);
  }

  /**
   * Generates embeddings for a batch of text chunks.
   */
  async getBatchEmbeddings(textArray) {
    if (!Array.isArray(textArray)) {
      throw new Error('Expected array of strings for batch embeddings');
    }

    if (textArray.length === 0) return [];

    if (this.provider === 'openai' && this.apiKey) {
      return this._getOpenAIBatchEmbeddings(textArray);
    }

    if (this.provider === 'gemini' && this.apiKey) {
      // Gemini batch processing
      const results = [];
      for (const text of textArray) {
        results.push(await this._getGeminiEmbedding(text));
      }
      return results;
    }

    return textArray.map((text) => generateLocalVector(text, this.dimensions));
  }

  async _getOpenAIEmbedding(text) {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: text,
          model: this.model || 'text-embedding-3-small',
          dimensions: this.dimensions,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`OpenAI Embedding API error (${response.status}): ${errBody}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.warn(`[EmbeddingService] OpenAI failed (${error.message}). Falling back to local vectors.`);
      return generateLocalVector(text, this.dimensions);
    }
  }

  async _getOpenAIBatchEmbeddings(textArray) {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: textArray,
          model: this.model || 'text-embedding-3-small',
          dimensions: this.dimensions,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`OpenAI Batch Embedding API error: ${errBody}`);
      }

      const data = await response.json();
      return data.data.map((item) => item.embedding);
    } catch (error) {
      console.warn(`[EmbeddingService] OpenAI Batch failed (${error.message}). Falling back to local vectors.`);
      return textArray.map((t) => generateLocalVector(t, this.dimensions));
    }
  }

  async _getGeminiEmbedding(text) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:embedContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text }] },
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini Embedding error (${response.status}): ${err}`);
      }

      const data = await response.json();
      return data.embedding.values;
    } catch (error) {
      console.warn(`[EmbeddingService] Gemini failed (${error.message}). Falling back to local vectors.`);
      return generateLocalVector(text, this.dimensions);
    }
  }
}

export const embeddingService = new EmbeddingService();
