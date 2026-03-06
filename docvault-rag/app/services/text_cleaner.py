"""
Text cleaner: normalises extracted PDF text before chunking.

Rules applied (in order):
1. Collapse repeated whitespace / normalise line endings.
2. Strip standalone page-number lines (e.g. "42", "Page 42 of 100").
3. Remove repeated short lines that appear on many pages (header/footer heuristic).
   A line is considered a repeated header/footer if it appears verbatim in > 70 %
   of the pages passed to `build_page_filter` and is shorter than 80 chars.
"""

import re
import logging
from collections import Counter

logger = logging.getLogger(__name__)

# ─── Regexes ──────────────────────────────────────────────────────────────────

# Standalone page markers: "42", "- 42 -", "Page 42", "Page 42 of 100"
_PAGE_NUM_RE = re.compile(
    r"^\s*[-–—]?\s*(page\s+)?\d+(\s+(of|/)\s+\d+)?\s*[-–—]?\s*$",
    re.IGNORECASE,
)


def _collapse_whitespace(text: str) -> str:
    """Replace runs of spaces/tabs with a single space; normalise line endings."""
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)  # keep at most one blank line
    return text.strip()


def _strip_page_numbers(text: str) -> str:
    """Remove lines that look like standalone page numbers."""
    lines = text.splitlines()
    cleaned = [ln for ln in lines if not _PAGE_NUM_RE.match(ln)]
    return "\n".join(cleaned)


def build_page_filter(pages: list[dict]) -> set[str]:
    """
    Given extracted pages (list of {"page": int, "text": str}),
    return a set of line strings that appear on > 70% of pages.
    These are treated as repeated headers/footers and will be stripped.

    Only considers lines shorter than 80 characters (to avoid stripping
    actual content that happens to repeat).
    """
    total_pages = len(pages)
    if total_pages < 3:
        return set()  # not enough pages to reliably detect headers/footers

    line_counts: Counter = Counter()
    threshold = 0.70

    for p in pages:
        # Deduplicate lines per page before counting
        page_lines = {ln.strip() for ln in p["text"].splitlines() if ln.strip()}
        for ln in page_lines:
            if len(ln) < 80:
                line_counts[ln] += 1

    repeated: set[str] = {
        ln for ln, count in line_counts.items()
        if count / total_pages > threshold
    }

    if repeated:
        logger.debug("[text_cleaner] detected %d repeated header/footer lines", len(repeated))

    return repeated


def clean_text(text: str, repeated_lines: set[str] | None = None) -> str:
    """
    Apply all cleaning rules to a single page's text.

    Args:
        text: Raw extracted text from one PDF page.
        repeated_lines: Optional set of header/footer lines to strip (from
                        build_page_filter). Pass None or empty set to skip.

    Returns:
        Cleaned text string.
    """
    text = _collapse_whitespace(text)
    text = _strip_page_numbers(text)

    if repeated_lines:
        lines = text.splitlines()
        lines = [ln for ln in lines if ln.strip() not in repeated_lines]
        text = "\n".join(lines)

    return _collapse_whitespace(text)  # final pass after line removal
