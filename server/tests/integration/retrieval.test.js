import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { hybridRetriever } from '../../src/services/retrieval/hybridRetriever.js';

describe('Hybrid Retrieval Engine Integration', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('should retrieve Law 28.3.2 for helmet struck behind wicketkeeper query', async () => {
    const result = await hybridRetriever.retrieve('What happens if the ball hits the helmet placed behind the wicketkeeper?');
    expect(result.evidence.length).toBeGreaterThan(0);

    const topChunk = result.evidence[0];
    expect(topChunk.lawNumber).toBe(28);
    expect(topChunk.text).toContain('helmet');
    expect(topChunk.text).toContain('5 penalty runs');
    expect(topChunk.source.issuingOrganisation).toBe('MCC');
    expect(topChunk.source.version).toBe('2017 Code 3rd Edition - 2022');
  });

  it('should retrieve Law 41.16 for non-striker run out query', async () => {
    const result = await hybridRetriever.retrieve('Can a batter be run out while backing up at the non-striker end?');
    expect(result.evidence.length).toBeGreaterThan(0);

    const foundLaw41 = result.evidence.some((c) => c.lawNumber === 41 || c.text.includes('non-striker'));
    expect(foundLaw41).toBe(true);
  });

  it('should retrieve ICC T20I Free Hit clause when T20 format is requested', async () => {
    const result = await hybridRetriever.retrieve('Is there a free hit for any no ball in T20I?', { format: 'T20I' });
    expect(result.evidence.length).toBeGreaterThan(0);

    const freeHitChunk = result.evidence.find((c) => c.text.includes('Free Hit') || c.clauseNumber === '21.19.1');
    expect(freeHitChunk).toBeDefined();
    expect(freeHitChunk.source.issuingOrganisation).toBe('ICC');
  });
});
