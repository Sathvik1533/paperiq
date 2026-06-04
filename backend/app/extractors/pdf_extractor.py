import os
import fitz  # PyMuPDF
from app.extractors.base import BaseExtractor, ExtractedDocument, ExtractionError
from app.logger import get_logger

log = get_logger(__name__)


class PDFExtractor(BaseExtractor):
    """Extracts text from PDF files using PyMuPDF."""

    def can_handle(self, file_path: str) -> bool:
        return file_path.lower().endswith(".pdf")

    def extract(self, file_path: str) -> ExtractedDocument:
        if not os.path.exists(file_path):
            raise ExtractionError(f"File not found: {file_path}")
        try:
            doc = fitz.open(file_path)
            pages_text = []
            for page in doc:
                pages_text.append(page.get_text("text"))
            raw_text = "\n".join(pages_text).strip()
            page_count = len(doc)
            metadata = doc.metadata or {}
            doc.close()
            log.info(f"[PDFExtractor] Extracted {page_count} pages from {os.path.basename(file_path)}")
            return ExtractedDocument(
                raw_text=raw_text,
                file_path=file_path,
                file_type="pdf",
                file_name=os.path.basename(file_path),
                file_size_bytes=os.path.getsize(file_path),
                page_count=page_count,
                metadata=metadata,
                extraction_method="pymupdf",
            )
        except Exception as e:
            raise ExtractionError(f"PDF extraction failed for {file_path}: {e}") from e
