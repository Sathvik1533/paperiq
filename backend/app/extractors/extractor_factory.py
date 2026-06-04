import os
from app.extractors.base import BaseExtractor, ExtractedDocument, ExtractionError
from app.extractors.pdf_extractor import PDFExtractor
from app.extractors.docx_extractor import DocxExtractor
from app.extractors.doc_extractor import DocExtractor
from app.extractors.html_extractor import HtmlExtractor
from app.extractors.text_normalizer import normalize
from app.logger import get_logger

log = get_logger(__name__)

# Ordered list — first match wins
_EXTRACTORS: list[BaseExtractor] = [
    PDFExtractor(),
    DocxExtractor(),
    DocExtractor(),
    HtmlExtractor(),
]

ACADEMIC_EXTENSIONS = {".pdf", ".docx", ".doc", ".html", ".htm"}
ARCHIVE_EXTENSIONS  = {".rar", ".zip", ".tar.gz", ".7z", ".tar"}


def is_academic_file(file_path: str) -> bool:
    ext = os.path.splitext(file_path.lower())[1]
    return ext in ACADEMIC_EXTENSIONS


def is_archive(file_path: str) -> bool:
    lower = file_path.lower()
    return any(lower.endswith(ext) for ext in ARCHIVE_EXTENSIONS)


def extract(file_path: str, normalize_text: bool = True) -> ExtractedDocument:
    """
    Detect file type and run the appropriate extractor.
    Normalizes text by default.
    Raises ExtractionError if no extractor handles the file.
    """
    for extractor in _EXTRACTORS:
        if extractor.can_handle(file_path):
            doc = extractor.extract(file_path)
            if normalize_text:
                doc.raw_text = normalize(doc.raw_text)
            return doc

    ext = os.path.splitext(file_path)[1].lower()
    raise ExtractionError(
        f"No extractor available for file type '{ext}': {os.path.basename(file_path)}"
    )


def extract_archive_and_process(archive_path: str, dest_dir: str) -> list[ExtractedDocument]:
    """
    Extract archive → find academic files → run extractor on each.
    Returns list of ExtractedDocuments (skips unsupported files silently).
    """
    from app.extractors.archive_extractor import ArchiveExtractor

    archive_ext = ArchiveExtractor()
    files = archive_ext.extract_to_dir(archive_path, dest_dir)
    log.info(f"[ExtractorFactory] Archive yielded {len(files)} files")

    results: list[ExtractedDocument] = []
    for file_path in files:
        if not is_academic_file(file_path):
            log.debug(f"[ExtractorFactory] Skipping non-academic: {os.path.basename(file_path)}")
            continue
        try:
            doc = extract(file_path)
            results.append(doc)
            log.info(f"[ExtractorFactory] Extracted: {doc.file_name} ({doc.file_type}, {len(doc.raw_text)} chars)")
        except ExtractionError as e:
            log.warning(f"[ExtractorFactory] Failed: {os.path.basename(file_path)} — {e}")

    log.info(f"[ExtractorFactory] Processed {len(results)}/{len(files)} academic files")
    return results
