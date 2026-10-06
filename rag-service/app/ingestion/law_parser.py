"""Cricket Law parser for identifying laws, clauses, and subclauses from extracted text across MCC, ICC, and IPL rulebooks."""

import re
from typing import Any, Dict, List, Optional

LAW_NAME_MAP = {
    1: "The Players",
    2: "The Umpires",
    3: "The Scorers",
    4: "The Ball",
    5: "The Bat",
    6: "The Pitch",
    7: "The Creases",
    8: "The Wickets",
    9: "Preparation and Maintenance of the Playing Area",
    10: "Covering the Pitch",
    11: "Intervals",
    12: "Start of Play; Cessation of Play",
    13: "Innings",
    14: "The Follow-on",
    15: "Declaration and Forfeiture",
    16: "The Result",
    17: "The Over",
    18: "Scoring Runs",
    19: "Boundaries",
    20: "Dead Ball",
    21: "No Ball",
    22: "Wide Ball",
    23: "Bye and Leg Bye",
    24: "Fielder's Absence; Substitutes",
    25: "Batter's Innings; Runners",
    26: "Practice on the Field",
    27: "The Wicket-keeper",
    28: "The Fielder",
    29: "The Wicket is Broken",
    30: "Batter out of their Ground",
    31: "Appeals",
    32: "Bowled",
    33: "Caught",
    34: "Hit the Ball Twice",
    35: "Hit Wicket",
    36: "Leg Before Wicket",
    37: "Obstructing the Field",
    38: "Run Out",
    39: "Stumped",
    40: "Timed Out",
    41: "Unfair Play",
    42: "Players' Conduct",
}

LAW_HEADING_REGEX = re.compile(
    r"^(?:LAW\s+(\d{1,2})|SECTION\s+(\d{1,2}))\s*[-–—:\s]\s*(.*)$",
    re.IGNORECASE
)

CLAUSE_LINE_REGEX = re.compile(
    r"^(\d{1,2}\.\d{1,2}(?:\.\d{1,2}(?:\.\d{1,2})?)?)(?:\s+(.*))?$"
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

        lines = [l.strip() for l in p_text.split("\n") if l.strip()]
        i = 0
        while i < len(lines):
            line_str = lines[i]

            # 1. Check for Law Heading (e.g., LAW 28 - THE FIELDER)
            law_match = LAW_HEADING_REGEX.match(line_str)
            if law_match:
                # Flush previous clause
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
                title_str = law_match.group(3).strip()
                if current_law_num and int(current_law_num) in LAW_NAME_MAP:
                    current_law_title = LAW_NAME_MAP[int(current_law_num)]
                elif title_str:
                    current_law_title = title_str
                i += 1
                continue

            # 2. Check for standalone Law number line (e.g. "28" followed by "THE FIELDER")
            if re.match(r"^\d{1,2}$", line_str) and i + 1 < len(lines):
                next_line = lines[i + 1]
                num_val = int(line_str)
                if num_val in LAW_NAME_MAP and (next_line.isupper() or len(next_line) > 3):
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

                    current_law_num = float(num_val)
                    current_law_title = LAW_NAME_MAP[num_val]
                    i += 2
                    continue

            # 3. Check for Clause Header (e.g. 28.3 Protective helmets... or standalone 28.3 followed by title)
            clause_match = CLAUSE_LINE_REGEX.match(line_str)
            if clause_match:
                c_num = clause_match.group(1)
                c_inline_title = clause_match.group(2) or ""

                # Flush previous clause
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

                current_clause_num = c_num
                clause_page_start = p_idx
                clause_printed_start = p_printed

                # Infer Law number from clause prefix
                try:
                    derived_law = float(c_num.split(".")[0])
                    if current_law_num is None or abs(current_law_num - derived_law) > 0.1:
                        current_law_num = derived_law
                        current_law_title = LAW_NAME_MAP.get(int(derived_law), f"Law {int(derived_law)}")
                except (ValueError, IndexError):
                    pass

                # If title is on next line
                if not c_inline_title and i + 1 < len(lines):
                    next_str = lines[i + 1]
                    if not CLAUSE_LINE_REGEX.match(next_str) and not LAW_HEADING_REGEX.match(next_str):
                        current_clause_title = next_str
                        current_clause_lines.append(next_str)
                        i += 2
                        continue
                else:
                    current_clause_title = c_inline_title
                    if c_inline_title:
                        current_clause_lines.append(c_inline_title)

                i += 1
                continue

            # Accumulate text for current clause
            if current_clause_num:
                current_clause_lines.append(line_str)
            else:
                if not current_clause_lines:
                    current_clause_num = f"{int(current_law_num)}.0" if current_law_num else "1.0"
                    current_clause_title = f"{current_law_title} - Preamble"
                    clause_page_start = p_idx
                    clause_printed_start = p_printed
                current_clause_lines.append(line_str)

            i += 1

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
