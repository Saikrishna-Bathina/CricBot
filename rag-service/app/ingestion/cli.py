"""Command-line interface for cricket PDF inspection and ingestion."""

import argparse
import asyncio
import json
import sys
from pathlib import Path
from typing import Optional
from app.db.mongo import connect_to_mongo, close_mongo_connection
from app.ingestion.pdf_extractor import PDFExtractor
from app.ingestion.law_parser import parse_law_text
from app.ingestion.validator import validate_extraction
from app.ingestion.pipeline import IngestionPipeline
from app.ingestion.manifest import ManifestManager


async def cmd_inspect(input_dir: str, output_report: Optional[str] = None):
    p = Path(input_dir)
    if not p.exists():
        print(f"[ERROR] Directory not found: {input_dir}")
        sys.exit(1)

    pdf_files = list(p.glob("*.pdf"))
    if not pdf_files:
        print(f"[INFO] No PDF files found in {input_dir}")
        return

    print(f"\n=======================================================")
    print(f"  CRICBOT PDF INSPECTION REPORT ({len(pdf_files)} document(s) detected)")
    print(f"=======================================================\n")

    extractor = PDFExtractor()
    manifest_mgr = ManifestManager()
    reports = []

    for pdf in pdf_files:
        print(f"--> Inspecting: {pdf.name} ...")
        res = extractor.extract_document(pdf)
        clauses = parse_law_text(res["pages"])
        validation = validate_extraction(res, clauses)

        rep = {
            "filename": pdf.name,
            "sha256": res["sha256"],
            "pageCount": res["pageCount"],
            "clauseCount": len(clauses),
            "isApproved": validation.is_approved,
            "warnings": validation.warnings,
            "criticalErrors": validation.critical_errors,
        }
        reports.append(rep)

        print(f"    - SHA-256:     {res['sha256']}")
        print(f"    - Page Count:  {res['pageCount']}")
        print(f"    - Clauses:     {len(clauses)}")
        print(f"    - Approved:    {'YES' if validation.is_approved else 'NO'}")
        if validation.warnings:
            for w in validation.warnings:
                print(f"    - WARNING:     {w}")
        if validation.critical_errors:
            for err in validation.critical_errors:
                print(f"    - CRITICAL:    {err}")
        print("-" * 55)

    report_dir = Path(__file__).resolve().parent.parent.parent.parent / "knowledge-base" / "reports"
    report_dir.mkdir(parents=True, exist_ok=True)
    report_file = Path(output_report) if output_report else report_dir / "latest_inspection_report.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(reports, f, indent=2)
    print(f"\nInspection report saved to: {report_file}\n")


async def cmd_ingest(input_dir: str, dry_run: bool = False):
    p = Path(input_dir)
    if not p.exists():
        print(f"[ERROR] Directory not found: {input_dir}")
        sys.exit(1)

    pdf_files = list(p.glob("*.pdf"))
    if not pdf_files:
        print(f"[INFO] No PDF files found in {input_dir}")
        return

    print(f"\n=======================================================")
    print(f"  CRICBOT PDF INGESTION ({len(pdf_files)} document(s), dry_run={dry_run})")
    print(f"=======================================================\n")

    if not dry_run:
        await connect_to_mongo()

    try:
        pipeline = IngestionPipeline()
        manifest_mgr = ManifestManager()
        manifest_data = manifest_mgr.load_manifest()

        for pdf in pdf_files:
            print(f"--> Ingesting: {pdf.name} ...")
            # Lookup metadata in manifest
            meta = {}
            for doc in manifest_data.get("documents", []):
                if doc.get("targetFilename") == pdf.name or doc.get("originalFilename") == pdf.name:
                    meta = doc
                    break

            summary = await pipeline.process_pdf(pdf, manifest_meta=meta, dry_run=dry_run)
            print(f"    - Status:   {'Dry Run Completed' if dry_run else 'Stored in Atlas'}")
            print(f"    - Clauses:  {summary['clauseCount']}")
            print(f"    - Approved: {'YES' if summary['isApproved'] else 'NO'}")
            if not dry_run and summary.get("storedChunks"):
                print(f"    - Chunks:   {summary['storedChunks']}")
            print("-" * 55)

    finally:
        if not dry_run:
            await close_mongo_connection()


def main():
    parser = argparse.ArgumentParser(description="CricBot Official Cricket Law PDF Ingestion CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Inspect command
    inspect_parser = subparsers.add_parser("inspect", help="Inspect incoming PDFs without writing to DB")
    inspect_parser.add_argument("--input", "-i", required=True, help="Directory containing incoming PDFs")
    inspect_parser.add_argument("--report", "-r", required=False, help="Custom output path for inspection report")

    # Ingest command
    ingest_parser = subparsers.add_parser("ingest", help="Ingest approved PDFs into MongoDB Atlas")
    ingest_parser.add_argument("--input", "-i", required=True, help="Directory containing approved PDFs")
    ingest_parser.add_argument("--dry-run", action="store_true", help="Perform extraction and chunking without persisting")

    args = parser.parse_args()

    if args.command == "inspect":
        asyncio.run(cmd_inspect(args.input, args.report))
    elif args.command == "ingest":
        asyncio.run(cmd_ingest(args.input, dry_run=args.dry_run))


if __name__ == "__main__":
    main()
