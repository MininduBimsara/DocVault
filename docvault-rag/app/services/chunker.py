"""
Chunker: splits combined document text into overlapping chunks.
Preserves context across page boundaries while mapping each chunk to its primary page.
"""

import logging
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import settings

logger = logging.getLogger(__name__)


def chunk_pages(pages: list[dict]) -> list[dict]:
    """
    Concatenate pages, split them into overlapping chunks, and map chunks back to pages.

    Args:
        pages: List of {"page": int, "text": str} dicts from pdf_loader / text_cleaner.

    Returns:
        Flat list of {"page": int, "chunk_index": int, "text": str} dicts.
    """
    if not pages:
        return []

    combined_text_parts = []
    page_boundaries = []  # List of tuples: (start_char, end_char, page_num)
    
    current_offset = 0
    for p in pages:
        page_num = p["page"]
        text = p["text"]
        
        start_char = current_offset
        end_char = current_offset + len(text)
        page_boundaries.append((start_char, end_char, page_num))
        
        combined_text_parts.append(text)
        current_offset = end_char + 2  # +2 due to "\n\n" joining

    combined_text = "\n\n".join(combined_text_parts)

    # Word-based length function serves as a robust token-approximate metric for English texts
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        length_function=lambda text: len(text.split()),
        separators=["\n\n", "\n", " ", ""],
    )

    page_chunks = splitter.split_text(combined_text)
    chunks: list[dict] = []
    
    search_start = 0
    for idx, chunk_text in enumerate(page_chunks):
        if not chunk_text.strip():
            continue

        # Locate chunk position in the combined text to trace page numbers
        start_char = combined_text.find(chunk_text, search_start)
        if start_char == -1:
            start_char = search_start  # fallback

        end_char = start_char + len(chunk_text)
        search_start = start_char  # chunks are ordered; advance search index

        # Find the page that has the largest character overlap with this chunk
        best_page = None
        max_overlap = -1

        for p_start, p_end, p_num in page_boundaries:
            overlap_start = max(start_char, p_start)
            overlap_end = min(end_char, p_end)
            if overlap_start < overlap_end:
                overlap_len = overlap_end - overlap_start
                if overlap_len > max_overlap:
                    max_overlap = overlap_len
                    best_page = p_num

        if best_page is None:
            best_page = pages[0]["page"]  # fallback to first page

        chunks.append({
            "page": best_page,
            "chunk_index": idx,
            "text": chunk_text,
        })

    logger.info("[chunker] produced %d chunks from %d pages", len(chunks), len(pages))
    return chunks
