import crypto from 'crypto';

/**
 * Law-aware chunking engine for Official Cricket Laws & Playing Conditions.
 *
 * Rules:
 * - Detects MCC Law headings (e.g. "LAW 28 THE FIELDER", "Law 31: Timed Out")
 * - Detects numbered clauses (e.g. "28.3", "28.3.1", "41.16.1", "Clause 2.1")
 * - Preserves hierarchical metadata:
 *   - lawNumber (1 to 42)
 *   - lawTitle
 *   - clauseNumber
 *   - sectionHeading
 * - Splits oversized clauses at sentence or paragraph boundaries while preserving context
 */
export function chunkCricketDocument(rawText, docMetadata = {}) {
  if (!rawText || typeof rawText !== 'string') {
    return [];
  }

  const chunks = [];
  const lines = rawText.split(/\r?\n/);

  let currentLawNumber = docMetadata.defaultLawNumber || null;
  let currentLawTitle = docMetadata.defaultLawTitle || '';
  let currentSection = '';
  let currentClause = '';
  let currentBuffer = [];
  let chunkIndex = 0;
  let currentPage = 1;

  // Regex patterns for Cricket Law structures
  const lawHeaderRegex = /^(?:LAW\s*(\d{1,2})[:.\-\s]+|THE\s*LAWS\s*OF\s*CRICKET\s*[-–]\s*LAW\s*(\d{1,2})[:.\-\s]+)(.*)$/i;
  const clauseRegex = /^(?:(\d{1,2}\.\d+(?:\.\d+)?)|(?:Clause\s*(\d{1,2}(?:\.\d+)*)))\s*[-:.)]?\s*(.*)$/i;
  const pageMarkerRegex = /\[\[\s*PAGE\s*(\d+)\s*\]\]/i;

  function flushBuffer() {
    if (currentBuffer.length === 0) return;

    const text = currentBuffer.join(' ').replace(/\s+/g, ' ').trim();
    if (text.length < 25) {
      // Ignore tiny artifacts
      currentBuffer = [];
      return;
    }

    const contentHash = crypto.createHash('sha256').update(text).digest('hex');

    chunks.push({
      chunkIndex,
      text,
      lawNumber: currentLawNumber,
      lawTitle: currentLawTitle || (currentLawNumber ? `Law ${currentLawNumber}` : 'General Regulation'),
      clauseNumber: currentClause || (currentLawNumber ? `${currentLawNumber}` : ''),
      sectionHeading: currentSection || currentLawTitle || 'General',
      pageStart: currentPage,
      pageEnd: currentPage,
      documentVersion: docMetadata.version || 'Current',
      issuingOrganisation: docMetadata.issuingOrganisation || 'MCC',
      applicableFormats: docMetadata.applicableFormats || ['ALL'],
      applicableCompetitions: docMetadata.applicableCompetitions || [],
      effectiveFrom: docMetadata.effectiveFrom || null,
      effectiveTo: docMetadata.effectiveTo || null,
      contentHash,
    });

    chunkIndex++;
    currentBuffer = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    // Check for page markers
    const pageMatch = line.match(pageMarkerRegex);
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10);
      continue;
    }

    // Check for Law Header (e.g., "LAW 28 - THE FIELDER")
    const lawMatch = line.match(lawHeaderRegex);
    if (lawMatch) {
      flushBuffer();
      const num = parseInt(lawMatch[1] || lawMatch[2], 10);
      if (num >= 1 && num <= 42) {
        currentLawNumber = num;
        currentLawTitle = `Law ${num} - ${lawMatch[3].trim() || 'General'}`;
        currentSection = currentLawTitle;
        currentClause = `${num}`;
      }
      continue;
    }

    // Check for Clause Header (e.g., "28.3 Protective helmets not in use")
    const clauseMatch = line.match(clauseRegex);
    if (clauseMatch) {
      // If we already have accumulated text in buffer, flush it before starting new clause
      if (currentBuffer.length > 0) {
        flushBuffer();
      }

      currentClause = clauseMatch[1] || clauseMatch[2];
      const remainder = clauseMatch[3] ? clauseMatch[3].trim() : '';

      // Infer law number from clause if missing (e.g. 28.3 implies Law 28)
      const majorNum = parseInt(currentClause.split('.')[0], 10);
      if (!currentLawNumber && majorNum >= 1 && majorNum <= 42) {
        currentLawNumber = majorNum;
      }

      if (remainder) {
        currentSection = remainder;
        currentBuffer.push(`${currentClause} ${remainder}`);
      } else {
        currentBuffer.push(line);
      }
      continue;
    }

    // Regular text line
    currentBuffer.push(line);

    // Safeguard chunk length (split around 1200 chars at sentence end)
    const currentLength = currentBuffer.join(' ').length;
    if (currentLength >= 1200 && /[.?!]$/.test(line)) {
      flushBuffer();
    }
  }

  // Flush remaining text
  flushBuffer();

  return chunks;
}
