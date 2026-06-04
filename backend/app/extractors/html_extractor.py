import os
import chardet
from bs4 import BeautifulSoup
from app.extractors.base import BaseExtractor, ExtractedDocument, ExtractionError
from app.logger import get_logger

log = get_logger(__name__)


class HtmlExtractor(BaseExtractor):
    """Extracts visible text from HTML files using BeautifulSoup."""

    def can_handle(self, file_path: str) -> bool:
        return file_path.lower().endswith((".html", ".htm"))

    def extract(self, file_path: str) -> ExtractedDocument:
        if not os.path.exists(file_path):
            raise ExtractionError(f"File not found: {file_path}")
        try:
            with open(file_path, "rb") as f:
                raw_bytes = f.read()
            detected = chardet.detect(raw_bytes)
            enc = detected.get("encoding") or "utf-8"
            html = raw_bytes.decode(enc, errors="ignore")
            soup = BeautifulSoup(html, "html.parser")
            for tag in soup(["script", "style"]):
                tag.decompose()
            raw_text = soup.get_text(separator="\n").strip()
            log.info(f"[HtmlExtractor] Extracted from {os.path.basename(file_path)}")
            return ExtractedDocument(
                raw_text=raw_text,
                file_path=file_path,
                file_type="html",
                file_name=os.path.basename(file_path),
                file_size_bytes=os.path.getsize(file_path),
                encoding=enc,
                extraction_method="beautifulsoup",
            )
        except Exception as e:
            raise ExtractionError(f"HTML extraction failed for {file_path}: {e}") from e
