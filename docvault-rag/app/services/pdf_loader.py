"""
PDF loader using PyMuPDF (fitz).

Returns a list of page dictionaries:
    [{"page": int (1-based), "text": str}, ...]

Pages whose extracted text is shorter than MIN_PAGE_CHARS are skipped
(covers blank pages, image-only pages, and boilerplate single-line pages).
"""

import logging
import pathlib

import fitz  # PyMuPDF

from app.core.config import settings

logger = logging.getLogger(__name__)


def load_pdf(file_path: str) -> list[dict]:
    """
    Extract text from each page of the PDF at file_path.

    Args:
        file_path: Absolute path to a .pdf file.

    Returns:
        List of {"page": int, "text": str} dicts for non-empty pages.

    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError: If the path does not end with .pdf.
        RuntimeError: If PyMuPDF cannot open the file.
    """
    path = pathlib.Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {file_path}")
    if path.suffix.lower() != ".pdf":
        raise ValueError(f"Expected a .pdf file, got: {file_path}")

    logger.info("[pdf_loader] opening %s", path.name)

    try:
        doc = fitz.open(str(path))
    except Exception as exc:
        raise RuntimeError(f"PyMuPDF could not open {file_path}: {exc}") from exc

    pages: list[dict] = []
    total = len(doc)

    for i, page in enumerate(doc):
        text = page.get_text("text")
        if not text or len(text.strip()) < settings.MIN_PAGE_CHARS:
            logger.debug(
                "[pdf_loader] skipping page %d/%d (text_len=%d < MIN_PAGE_CHARS=%d)",
                i + 1, total, len(text.strip()) if text else 0, settings.MIN_PAGE_CHARS,
            )
            continue
        pages.append({"page": i + 1, "text": text})

    doc.close()
    logger.info("[pdf_loader] extracted %d/%d usable pages from %s", len(pages), total, path.name)
    return pages
