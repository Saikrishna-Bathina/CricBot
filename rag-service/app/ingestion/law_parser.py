"""Cricket Law parser for identifying laws, clauses, and subclauses from extracted text."""

import re
from typing import Any, Dict, List, Optional, Tuple

LAW_HEADING_REGEX = re.compile(
    r"^(?:LAW\s+(\d{1,2})|SECTION\s+(\d{1,2}))\s*[-–—:]\s*(.+)$",
    re.IGNORECASE | re.MULTILINE
)

CLAUSE_HEADING_REGEX = re.compile(
    r"^(\d{1,2}\.\d{1,2}(?:\.\d{1,2})?)\s+([A-Z][A-Za-z0-9\s,\-–—()/'\"]+)$",
    re.MULTILINE
)


class ParsedClause:
    def __init__(
        self,
        law_number: Optional[float],
        clause_number: str,
        title: str,
        content: str,
        parent_law: str,
        page_start: int,
        page_end: int,
        printed_page_start: Optional[int] = None,
        printed_page_end: Optional[int] = None,
    ):
        self.law_number = law_number
        self.clause_number = clause_number
        self.title = title
        self.content = content
        self.parent_law = parent_law
        self.page_start = page_start
        self.page_end = page_end
        self.printed_page_start = printed_page_start
        self.printed_page_end = printed_page_end

    def to_dict(self) -> Dict[str, Any]:
        return {
            "lawNumber": self.law_number,
            "clauseNumber": self.clause_number,
            "title": self.title,
            "content": self.content,
            "parentLaw": self.parent_law,
            "pageStart": self.page_start,
            "pageEnd": self.page_end,
            "printedPageStart": self.printed_page_start,
            "printedPageEnd": self.printed_page_end,
        }


def parse_law_text(pages: List[Any]) -> List[ParsedClause]:
    """Parses extracted pages into structured law and clause objects."""
    clauses: List[ParsedClause] = []

    current_law_num: Optional[float] = None
    current_law_title = "General Cricket Laws"
    current_clause_num: Optional[str] = None
    current_clause_title = ""
    current_clause_lines: List[str] = []
    clause_page_start = 1
    clause_printed_start = None

    for page in pages:
        p_idx = page.page_index
        p_text = page.raw_text
        p_printed = page.printed_page

        lines = p_text.split("\n")
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            # Check if this line is a Law heading
            law_match = LAW_HEADING_REGEX.match(line_str)
            if law_match:
                # Flush previous clause if active
                if current_clause_num and current_clause_lines:
                    clauses.append(
                        ParsedClause(
                            law_number=current_law_num,
                            clause_number=current_clause_num,
                            title=current_clause_title or f"Clause {current_clause_num}",
                            content="\n".join(current_clause_lines).strip(),
                            parent_law=f"Law {int(current_law_num)} - {current_law_title}" if current_law_num else current_law_title,
                            page_start=clause_page_start,
                            page_end=p_idx,
                            printed_page_start=clause_printed_start,
                            printed_page_end=p_printed,
                        )
                    )
                    current_clause_num = None
                    current_clause_lines = []

                num_str = law_match.group(1) or law_match.group(2)
                current_law_num = float(num_str) if num_str else None
                current_law_title = law_match.group(3).strip()
                continue

            # Check if this line is a Clause heading (e.g., 28.3 Protective helmets...)
            clause_match = CLAUSE_HEADING_REGEX.match(line_str)
            if clause_match:
                if current_clause_num and current_clause_lines:
                    clauses.append(
                        ParsedClause(
                            law_number=current_law_num,
                            clause_number=current_clause_num,
                            title=current_clause_title or f"Clause {current_clause_num}",
                            content="\n".join(current_clause_lines).strip(),
                            parent_law=f"Law {int(current_law_num)} - {current_law_title}" if current_law_num else current_law_title,
                            page_start=clause_page_start,
                            page_end=p_idx,
                            printed_page_start=clause_printed_start,
                            printed_page_end=p_printed,
                        )
                    )
                    current_clause_lines = []

                current_clause_num = clause_match.group(1).strip()
                current_clause_title = clause_match.group(2).strip()
                clause_page_start = p_idx
                clause_printed_start = p_printed

                # Extract law number from clause if not already found (e.g. "28.3" -> law 28)
                if current_law_num is None:
                    try:
                        current_law_num = float(current_clause_num.split(".")[0])
                    except (ValueError, IndexError):
                        pass

                current_clause_lines.append(line_str)
                continue

            # Accumulate text for current clause
            if current_clause_num:
                current_clause_lines.append(line_str)
            else:
                # Text before the first clause heading (preamble, definitions, or intro)
                if not current_clause_lines:
                    current_clause_num = f"{int(current_law_num)}.0" if current_law_num else "1.0"
                    current_clause_title = f"{current_law_title} - Introduction"
                    clause_page_start = p_idx
                    clause_printed_start = p_printed
                current_clause_lines.append(line_str)

    # Flush final clause
    if current_clause_num and current_clause_lines:
        clauses.append(
            ParsedClause(
                law_number=current_law_num,
                clause_number=current_clause_num,
                title=current_clause_title or f"Clause {current_clause_num}",
                content="\n".join(current_clause_lines).strip(),
                parent_law=f"Law {int(current_law_num)} - {current_law_title}" if current_law_num else current_law_title,
                page_start=clause_page_start,
                page_end=pages[-1].page_index if pages else 1,
                printed_page_start=clause_printed_start,
                printed_page_end=pages[-1].printed_page if pages else None,
            )
        )

    return clauses
