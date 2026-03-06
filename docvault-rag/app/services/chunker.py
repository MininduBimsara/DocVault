"""
Chunker: splits cleaned page text into overlapping chunks.

Each page is chunked independently to preserve accurate page-number metadata.
Chunk index resets per page so IDs are: {docId}_{page}_{chunkIndex}.

Returns a flat list:
    [{"page": int, "chunk_index": int, "text": str}, ...]
"""

import logging
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

_SPLITTER = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=100,
    length_function=len,
    # Default separators: ["\n\n", "\n", " ", ""]
)


def chunk_pages(pages: list[dict]) -> list[dict]:
    """
    Split each page's text into overlapping chunks.

    Args:
        pages: List of {"page": int, "text": str} dicts from pdf_loader / text_cleaner.

    Returns:
        Flat list of {"page": int, "chunk_index": int, "text": str} dicts.
        Empty pages (after cleaning) are skipped.
    """
    chunks: list[dict] = []

    for page_dict in pages:
        page_num = page_dict["page"]
        text = page_dict["text"].strip()

        if not text:
            continue

        page_chunks = _SPLITTER.split_text(text)

        for idx, chunk_text in enumerate(page_chunks):
            if not chunk_text.strip():
                continue
            chunks.append({
                "page": page_num,
                "chunk_index": idx,
                "text": chunk_text,
            })

    logger.info("[chunker] produced %d chunks from %d pages", len(chunks), len(pages))
    return chunks
