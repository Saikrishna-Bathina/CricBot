"""PyMuPDF and pypdf extractor for cricket law rulebooks."""

import hashlib
import re
from pathlib import Path
from typing import Any, Dict, List, Optional
import pymupdf
from app.core.logging import logger
from app.ingestion.ocr import OCREngine


class ExtractedPage:
    def __init__(
        self,
        page_index: int,  # 1-indexed
        raw_text: str,
        printed_page: Optional[int] = None,
        is_scanned: bool = False,
        char_count: int = 0,
        word_count: int = 0,
    ):
        self.page_index = page_index
        self.raw_text = raw_text
        self.printed_page = printed_page
        self.is_scanned = is_scanned
        self.char_count = char_count
        self.word_count = word_count

    def to_dict(self) -> Dict[str, Any]:
        return {
            "pageIndex": self.page_index,
            "printedPage": self.printed_page,
            "charCount": self.char_count,
            "wordCount": self.word_count,
            "isScanned": self.is_scanned,
        }


def calculate_pdf_sha256(file_path: Path) -> str:
    sha = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()


def detect_printed_page(text: str) -> Optional[int]:
    """Detects printed page numbers at start or end of page text."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    if not lines:
        return None
    # Check bottom lines
    for line in reversed(lines[-3:]):
        m = re.search(r"^(?:page\s*)?(\d{1,4})$", line, re.IGNORECASE)
        if m:
            try:
                return int(m.group(1))
            except ValueError:
                pass
    # Check top lines
    for line in lines[:3]:
        m = re.search(r"^(?:page\s*)?(\d{1,4})$", line, re.IGNORECASE)
        if m:
            try:
                return int(m.group(1))
            except ValueError:
                pass
    return None


THIRD_PARTY_WATERMARKS = [
    re.compile(r"downloaded by.*", re.IGNORECASE),
    re.compile(r"scan to open on studocu.*", re.IGNORECASE),
    re.compile(r"studocu is not sponsored.*", re.IGNORECASE),
    re.compile(r"physical education \(jawahar.*", re.IGNORECASE),
    re.compile(r"lomoarcpsd\|\d+", re.IGNORECASE),
]


def clean_page_text(raw_text: str) -> str:
    """Removes 3rd-party watermarks, normalizing spaces and unicode punctuation."""
    if not raw_text:
        return ""
    normalized = (
        raw_text.replace("\xa0", " ")
        .replace("\u202f", " ")
        .replace("\u2013", "-")
        .replace("\u2014", "-")
        .replace("\u2018", "'")
        .replace("\u2019", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
    )
    lines = normalized.split("\n")
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if any(wm.search(stripped) for wm in THIRD_PARTY_WATERMARKS):
            continue
        cleaned_lines.append(stripped)
    return "\n".join(cleaned_lines)


class PDFExtractor:
    def __init__(self, ocr_engine: Optional[OCREngine] = None):
        self.ocr_engine = ocr_engine or OCREngine()

    def extract_document(self, file_path: Path) -> Dict[str, Any]:
        file_path = Path(file_path)
        if not file_path.exists():
            raise FileNotFoundError(f"PDF not found at {file_path}")

        sha256 = calculate_pdf_sha256(file_path)
        doc = pymupdf.open(str(file_path))
        page_count = len(doc)
        metadata = doc.metadata or {}

        pages: List[ExtractedPage] = []
        suspicious_pages = []
        empty_pages = []

        for idx, page in enumerate(doc, start=1):
            raw_text = page.get_text("text")
            text = clean_page_text(raw_text).strip()
            char_count = len(text)
            word_count = len(text.split())
            is_scanned = False

            if char_count < 30:
                # Potential scanned page or cover
                if self.ocr_engine.is_available():
                    pix = page.get_pixmap()
                    img_bytes = pix.tobytes("png")
                    ocr_text = self.ocr_engine.ocr_page_image(img_bytes)
                    if ocr_text and len(ocr_text) > char_count:
                        text = ocr_text
                        char_count = len(text)
                        word_count = len(text.split())
                        is_scanned = True

            if char_count == 0:
                empty_pages.append(idx)
            elif char_count < 80:
                suspicious_pages.append(idx)

            printed_page = detect_printed_page(text)
            pages.append(
                ExtractedPage(
                    page_index=idx,
                    raw_text=text,
                    printed_page=printed_page,
                    is_scanned=is_scanned,
                    char_count=char_count,
                    word_count=word_count,
                )
            )

        doc.close()

        return {
            "filePath": str(file_path),
            "filename": file_path.name,
            "sha256": sha256,
            "pageCount": page_count,
            "metadata": metadata,
            "pages": pages,
            "emptyPages": empty_pages,
            "suspiciousPages": suspicious_pages,
            "hasScannedContent": any(p.is_scanned for p in pages),
        }
