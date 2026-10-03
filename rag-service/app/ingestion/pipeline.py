"""Ingestion pipeline coordinating extraction, parsing, validation, chunking, and storage."""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from app.ingestion.pdf_extractor import PDFExtractor
from app.ingestion.law_parser import parse_law_text
from app.ingestion.chunker import create_chunks_from_clauses
from app.ingestion.validator import validate_extraction
from app.embeddings.provider import get_embedding_provider
from app.db.repositories.documents import DocumentRepository
from app.db.repositories.chunks import ChunkRepository
from app.core.logging import logger


class IngestionPipeline:
    def __init__(self):
        self.extractor = PDFExtractor()
        self.embedding_provider = get_embedding_provider()
        self.doc_repo = DocumentRepository()
        self.chunk_repo = ChunkRepository()

    async def process_pdf(
        self,
        pdf_path: Path,
        manifest_meta: Optional[Dict[str, Any]] = None,
        dry_run: bool = False,
    ) -> Dict[str, Any]:
        """Processes a single PDF through the complete ingestion pipeline."""
        pdf_path = Path(pdf_path)
        logger.info("Starting ingestion for %s (dry_run=%s)", pdf_path.name, dry_run)

        # 1. Extraction
        extraction = self.extractor.extract_document(pdf_path)

        # 2. Parsing
        clauses = parse_law_text(extraction["pages"])

        # 3. Validation
        validation = validate_extraction(extraction, clauses)

        manifest_meta = manifest_meta or {}
        format_type = manifest_meta.get("format", "All")
        competition_type = manifest_meta.get("competition", "All")
        authority = manifest_meta.get("authority", "MCC")
        edition = manifest_meta.get("edition", "Official Edition")
        effective_date = manifest_meta.get("effectiveStartDate", "2022-10-01")

        summary = {
            "filename": pdf_path.name,
            "sha256": extraction["sha256"],
            "pageCount": extraction["pageCount"],
            "clauseCount": len(clauses),
            "isApproved": validation.is_approved,
            "warnings": validation.warnings,
            "criticalErrors": validation.critical_errors,
        }

        if dry_run or not validation.is_approved:
            logger.info("Pipeline finished in dry_run or unapproved mode for %s", pdf_path.name)
            return summary

        # 4. Chunk creation
        doc_data = {
            "title": manifest_meta.get("documentTitle", pdf_path.stem),
            "edition": edition,
            "effectiveDate": effective_date,
            "format": format_type,
            "competition": competition_type,
            "authority": authority,
            "status": "approved" if validation.is_approved else "pending",
            "chunkCount": len(clauses),
            "checksum": extraction["sha256"],
            "metadata": {
                "sourceUrl": manifest_meta.get("officialSourceUrl"),
                "originalFilename": pdf_path.name,
                "language": "en",
                "pageCount": extraction["pageCount"],
                "extractionNotes": f"Auto-ingested with {len(clauses)} clauses.",
            },
        }

        # 5. Database persistence
        doc_id = await self.doc_repo.upsert_document(doc_data)
        summary["documentId"] = doc_id

        chunks = create_chunks_from_clauses(
            clauses,
            document_id=doc_id,
            format_type=format_type,
            competition_type=competition_type,
            effective_date=effective_date,
        )

        logger.info("Generating embeddings for %d chunks of %s...", len(chunks), pdf_path.name)
        for chunk in chunks:
            text_for_embedding = f"{chunk['parentLaw']} | {chunk['title']}: {chunk['content']}"
            chunk["embedding"] = await self.embedding_provider.get_embedding(text_for_embedding)

        # Remove previous chunks for this document if re-ingesting
        await self.chunk_repo.delete_by_document_id(doc_id)
        await self.chunk_repo.insert_many(chunks)

        logger.info("Successfully ingested %s with %d chunks into MongoDB.", pdf_path.name, len(chunks))
        summary["storedChunks"] = len(chunks)
        return summary
