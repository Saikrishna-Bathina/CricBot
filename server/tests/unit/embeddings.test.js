import { describe, it, expect } from 'vitest';
import { embeddingService } from '../../src/services/embeddings/embeddingService.js';

describe('Embedding Service', () => {
  it('should generate normalized vector of specified dimensions', async () => {
    const vector = await embeddingService.getEmbedding('protective helmets placed behind wicketkeeper 5 penalty runs');
    expect(Array.isArray(vector)).toBe(true);
    expect(vector.length).toBe(768);

    // Verify L2 norm is approximately 1.0
    let norm = 0;
    for (const val of vector) {
      norm += val * val;
    }
    expect(Math.sqrt(norm)).toBeCloseTo(1.0, 2);
  });

  it('should generate batch embeddings with consistent dimensions', async () => {
    const texts = [
      'Law 28 The Fielder',
      'Law 31 Timed Out',
      'Law 37 Obstructing the field'
    ];
    const vectors = await embeddingService.getBatchEmbeddings(texts);
    expect(vectors.length).toBe(3);
    expect(vectors[0].length).toBe(768);
    expect(vectors[1].length).toBe(768);
    expect(vectors[2].length).toBe(768);
  });
});
