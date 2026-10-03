import { describe, it, expect } from 'vitest';
import { chunkCricketDocument } from '../../src/services/ingestion/chunker.js';

describe('Law-Aware Chunker', () => {
  it('should split raw text into law-aware chunks with preserved metadata', () => {
    const sampleText = `
[[ PAGE 45 ]]
LAW 28 - THE FIELDER
28.1 Protective equipment
No fielder other than the wicket-keeper shall be permitted to wear gloves or external leg guards.
28.3 Protective helmets not in use
28.3.1 An item of protective equipment shall be placed only on the ground behind the wicket-keeper and in line with both sets of wickets.
28.3.2 If the ball while in play strikes a helmet placed as described in 28.3.1, the ball shall become dead and the umpire shall award 5 penalty runs to the batting side.
`;

    const chunks = chunkCricketDocument(sampleText, {
      version: '2017 Code 3rd Edition - 2022',
      issuingOrganisation: 'MCC',
      applicableFormats: ['ALL'],
    });

    expect(chunks.length).toBeGreaterThanOrEqual(2);

    const helmetChunk = chunks.find((c) => c.clauseNumber === '28.3.2' || c.text.includes('strikes a helmet'));
    expect(helmetChunk).toBeDefined();
    expect(helmetChunk.lawNumber).toBe(28);
    expect(helmetChunk.lawTitle).toContain('Law 28');
    expect(helmetChunk.pageStart).toBe(45);
    expect(helmetChunk.issuingOrganisation).toBe('MCC');
    expect(helmetChunk.text).toContain('award 5 penalty runs');
    expect(typeof helmetChunk.contentHash).toBe('string');
  });

  it('should handle non-striker run out (Law 41.16)', () => {
    const sampleLaw41 = `
LAW 41 - UNFAIR PLAY
41.16 Non-striker leaving their ground early
41.16.1 If the non-striker is out of their ground at any time from the moment the ball comes into play until the instant when the bowler would normally have been expected to release the ball, the non-striker is liable to be Run out.
`;
    const chunks = chunkCricketDocument(sampleLaw41, {
      version: '2022 Update',
      issuingOrganisation: 'MCC',
    });

    const runOutChunk = chunks.find((c) => c.text.includes('liable to be Run out'));
    expect(runOutChunk).toBeDefined();
    expect(runOutChunk.lawNumber).toBe(41);
    expect(runOutChunk.clauseNumber).toBe('41.16.1');
  });
});
