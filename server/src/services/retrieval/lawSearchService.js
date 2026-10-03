import DocumentChunk from '../../models/DocumentChunk.js';
import Document from '../../models/Document.js';

export class LawSearchService {
  /**
   * Search laws and clauses with pagination and metadata filters.
   */
  async searchLaws({
    q = '',
    lawNumber = null,
    clauseNumber = null,
    issuingOrganisation = null,
    format = null,
    page = 1,
    limit = 10,
  }) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * pageSize;

    const query = {};

    // Filter by Law Number
    if (lawNumber) {
      query.lawNumber = parseInt(lawNumber, 10);
    }

    // Filter by Clause Number
    if (clauseNumber) {
      query.clauseNumber = new RegExp(`^${clauseNumber}`, 'i');
    }

    // Filter by Issuing Organisation (MCC, ICC, etc.)
    if (issuingOrganisation && issuingOrganisation !== 'ALL') {
      query.issuingOrganisation = issuingOrganisation;
    }

    // Filter by Format
    if (format && format !== 'ALL') {
      query.applicableFormats = { $in: [format, 'ALL'] };
    }

    // Text / Keyword Search
    if (q && q.trim()) {
      const cleanTerm = q.trim();
      const numMatch = cleanTerm.match(/^law\s*(\d{1,2})$/i);

      if (numMatch) {
        query.lawNumber = parseInt(numMatch[1], 10);
      } else {
        query.$or = [
          { text: { $regex: cleanTerm, $options: 'i' } },
          { lawTitle: { $regex: cleanTerm, $options: 'i' } },
          { sectionHeading: { $regex: cleanTerm, $options: 'i' } },
          { clauseNumber: { $regex: cleanTerm, $options: 'i' } },
        ];
      }
    }

    const total = await DocumentChunk.countDocuments(query);
    const chunks = await DocumentChunk.find(query)
      .populate('documentId', 'title version status sourceUrl issuingOrganisation publishedAt')
      .sort({ lawNumber: 1, clauseNumber: 1, chunkIndex: 1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const items = chunks.map((chunk) => {
      const parentDoc = chunk.documentId || {};
      return {
        _id: chunk._id,
        lawNumber: chunk.lawNumber,
        lawTitle: chunk.lawTitle,
        clauseNumber: chunk.clauseNumber,
        sectionHeading: chunk.sectionHeading,
        excerpt: chunk.text,
        pageStart: chunk.pageStart,
        pageEnd: chunk.pageEnd,
        issuingOrganisation: chunk.issuingOrganisation,
        applicableFormats: chunk.applicableFormats,
        document: {
          id: parentDoc._id,
          title: parentDoc.title || 'Official Cricket Rulebook',
          version: parentDoc.version || chunk.documentVersion,
          sourceUrl: parentDoc.sourceUrl || '',
          status: parentDoc.status,
        },
      };
    });

    return {
      items,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasNext: pageNum * pageSize < total,
        hasPrev: pageNum > 1,
      },
    };
  }

  /**
   * Retrieves a single official source document with all its clauses.
   */
  async getSourceDetails(sourceId) {
    const document = await Document.findById(sourceId).lean();
    if (!document) {
      throw new Error('Official source document not found');
    }

    const clauses = await DocumentChunk.find({ documentId: sourceId })
      .select('chunkIndex lawNumber lawTitle clauseNumber sectionHeading text pageStart pageEnd')
      .sort({ chunkIndex: 1 })
      .lean();

    return {
      document,
      clauseCount: clauses.length,
      clauses,
    };
  }
}

export const lawSearchService = new LawSearchService();
