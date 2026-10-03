"""Ingestion validator producing quality and review reports for cricket PDFs."""

from typing import Any, Dict, List
from app.ingestion.law_parser import ParsedClause


class DocumentValidationReport:
    def __init__(self, filename: str, sha256: str):
        self.filename = filename
        self.sha256 = sha256
        self.page_count = 0
        self.empty_pages: List[int] = []
        self.suspicious_pages: List[int] = []
        self.clause_count = 0
        self.warnings: List[str] = []
        self.critical_errors: List[str] = []
        self.is_approved = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "filename": self.filename,
            "sha256": self.sha256,
            "pageCount": self.page_count,
            "clauseCount": self.clause_count,
            "emptyPages": self.empty_pages,
            "suspiciousPages": self.suspicious_pages,
            "warnings": self.warnings,
            "criticalErrors": self.critical_errors,
            "isApproved": self.is_approved,
        }


def validate_extraction(extraction_result: Dict[str, Any], clauses: List[ParsedClause]) -> DocumentValidationReport:
    """Validates the extracted pages and parsed clauses for completeness and integrity."""
    report = DocumentValidationReport(
        filename=extraction_result["filename"],
        sha256=extraction_result["sha256"],
    )
    report.page_count = extraction_result["pageCount"]
    report.empty_pages = extraction_result["emptyPages"]
    report.suspicious_pages = extraction_result["suspiciousPages"]
    report.clause_count = len(clauses)

    # Check page count
    if report.page_count == 0:
        report.critical_errors.append("PDF contains 0 pages.")

    # Check empty pages
    if len(report.empty_pages) > (report.page_count * 0.3):
        report.warnings.append(f"High number of empty pages: {len(report.empty_pages)} / {report.page_count}")

    # Check clause extraction count
    if report.clause_count == 0:
        report.critical_errors.append("No law or clause structures were detected.")
    elif report.clause_count < 5:
        report.warnings.append(f"Unusually low clause count ({report.clause_count}) for official cricket rulebook.")

    # Check clause number continuity
    detected_clauses = [c.clause_number for c in clauses]
    if len(set(detected_clauses)) != len(detected_clauses):
        report.warnings.append("Duplicate clause numbers detected during parsing.")

    # Approval decision
    report.is_approved = (len(report.critical_errors) == 0 and report.clause_count > 0)
    return report
