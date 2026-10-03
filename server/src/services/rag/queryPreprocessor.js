import { extractQueryEntities } from '../retrieval/hybridRetriever.js';

/**
 * Preprocesses user inquiry, detecting intent, format, and authority.
 */
export function preprocessQuery(rawQuery, userOptions = {}) {
  const normalizedText = (rawQuery || '').trim().replace(/\s+/g, ' ');
  const entities = extractQueryEntities(normalizedText);

  // Detect query mode
  let queryType = 'general_question';
  if (/^what (?:is|would be) the (?:decision|ruling)|is (?:he|she|the batter|the bowler) out|what happens if|scenario|umpire ruling/i.test(normalizedText)) {
    queryType = 'scenario_analysis';
  } else if (/quiz|test|mcq|practice question/i.test(normalizedText)) {
    queryType = 'quiz_request';
  }

  // Determine target competition/format
  const resolvedFormat = userOptions.format || entities.format || 'ALL';
  const resolvedCompetition = userOptions.competition || 'ALL';

  return {
    originalQuery: rawQuery,
    normalizedQuery: normalizedText,
    queryType,
    entities,
    resolvedFormat,
    resolvedCompetition,
    isHistorical: entities.isHistorical || userOptions.isHistorical || false,
  };
}
