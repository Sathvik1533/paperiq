import os
import subprocess
import tempfile
from app.extractors.base import BaseExtractor, ExtractedDocument, ExtractionError
from app.logger import get_logger

log = get_logger(__name__)

# Tools tried in order — whichever is installed wins
_DOC_TOOLS = ["antiword", "catdoc", "unoconv"]


def _find_tool() -> str | None:
    for tool in _DOC_TOOLS:
        result = subprocess.run(["which", tool], capture_output=True, text=True)
        if result.returncode == 0:
            return tool
    return None


class DocExtractor(BaseExtractor):
    """
    Extracts text from legacy .doc files.
    Tries antiword → catdoc → unoconv (convert to docx, then DocxExtractor).
    Falls back to raw binary string extraction if all tools missing.
    """

    def can_handle(self, file_path: str) -> bool:
        return file_path.lower().endswith(".doc")

    def extract(self, file_path: str) -> ExtractedDocument:
        if not os.path.exists(file_path):
            raise ExtractionError(f"File not found: {file_path}")

        tool = _find_tool()
        raw_text = ""
        method = "unknown"

        if tool in ("antiword", "catdoc"):
            try:
                result = subprocess.run(
                    [tool, file_path],
                    capture_output=True, text=True, timeout=30
                )
                raw_text = result.stdout.strip()
                method = tool
                log.info(f"[DocExtractor] Extracted via {tool}: {os.path.basename(file_path)}")
            except Exception as e:
                log.warning(f"[DocExtractor] {tool} failed: {e}")

        if not raw_text and tool == "unoconv":
            try:
                with tempfile.TemporaryDirectory() as tmpdir:
                    out_path = os.path.join(tmpdir, "converted.docx")
                    subprocess.run(
                        ["unoconv", "-f", "docx", "-o", out_path, file_path],
                        timeout=60, check=True
                    )
                    from app.extractors.docx_extractor import DocxExtractor
                    result = DocxExtractor().extract(out_path)
                    raw_text = result.raw_text
                    method = "unoconv+docx"
            except Exception as e:
                log.warning(f"[DocExtractor] unoconv failed: {e}")

        if not raw_text:
            # Last resort — decode raw bytes, strip non-printable chars
            try:
                import chardet
                with open(file_path, "rb") as f:
                    raw_bytes = f.read()
                detected = chardet.detect(raw_bytes)
                enc = detected.get("encoding") or "latin-1"
                raw_text = raw_bytes.decode(enc, errors="ignore")
                # Keep only printable-ish chars
                raw_text = "".join(c for c in raw_text if c.isprintable() or c in "\n\t ")
                method = "raw-bytes"
                log.warning(f"[DocExtractor] Used raw-bytes fallback for {os.path.basename(file_path)}")
            except Exception as e:
                raise ExtractionError(f"All DOC extraction methods failed for {file_path}: {e}") from e

        return ExtractedDocument(
            raw_text=raw_text.strip(),
            file_path=file_path,
            file_type="doc",
            file_name=os.path.basename(file_path),
            file_size_bytes=os.path.getsize(file_path),
            metadata={"tool_used": tool or "raw-bytes"},
            extraction_method=method,
        )
