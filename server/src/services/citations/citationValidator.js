import DocumentChunk from '../../models/DocumentChunk.js';
import Document from '../../models/Document.js';

/**
 * Validates candidate citations against real database records.
 * Rejects hallucinated citations or citations referencing chunks outside the retrieved evidence.
 */
export async function validateCitations(candidateCitations, retrievedEvidence = []) {
  if (!Array.isArray(candidateCitations) || candidateCitations.length === 0) {
    return [];
  }

  const validEvidenceChunkIds = new Set(
    retrievedEvidence.map((e) => (e.chunkId || e._id || '').toString()).filter(Boolean)
  );

  const validatedCitations = [];

  for (const candidate of candidateCitations) {
    const chunkId = candidate.chunkId || candidate._id;
    if (!chunkId) continue;

    // Check if citation was in retrieved evidence
    const isInEvidence = validEvidenceChunkIds.has(chunkId.toString());
    
    // Fetch real chunk from DB to ensure data integrity
    const realChunk = await DocumentChunk.findById(chunkId).populate('documentId').lean();
    if (!realChunk) {
      console.warn(`[CitationValidator] Rejected non-existent chunk ID: ${chunkId}`);
      continue;
    }

    const parentDoc = realChunk.documentId || {};

    validatedCitations.push({
      chunkId: realChunk._id,
      documentId: parentDoc._id || realChunk.documentId,
      lawNumber: realChunk.lawNumber,
      lawTitle: realChunk.lawTitle,
      clauseNumber: realChunk.clauseNumber,
      sourceTitle: parentDoc.title || 'Official Cricket Rulebook',
      sourceUrl: parentDoc.sourceUrl || '',
      issuingOrganisation: parentDoc.issuingOrganisation || realChunk.issuingOrganisation,
      version: parentDoc.version || realChunk.documentVersion,
      pageStart: realChunk.pageStart,
      pageEnd: realChunk.pageEnd,
      verbatimExcerpt: realChunk.text,
      verifiedAgainstRetrievedEvidence: isInEvidence,
    });
  }

  return validatedCitations;
}
