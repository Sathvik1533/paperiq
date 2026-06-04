import os
import shutil
import tempfile
import subprocess
from typing import List
from app.extractors.base import BaseExtractor, ExtractedDocument, ExtractionError
from app.logger import get_logger

log = get_logger(__name__)

ARCHIVE_EXTENSIONS = (".rar", ".zip", ".tar.gz", ".tar.bz2", ".7z", ".tar")


class ArchiveExtractor(BaseExtractor):
    """
    Extracts archives (RAR, ZIP, etc.) into a temp directory.
    Returns one ExtractedDocument whose raw_text is the list of
    extracted file paths (newline-separated) — callers iterate
    these paths and run the appropriate per-file extractor.

    Strategy:
      1. unar  (handles RAR + ZIP, installed on macOS/Linux)
      2. patoolib (Python fallback, handles most formats)
      3. zipfile (stdlib, ZIP only)
    """

    def can_handle(self, file_path: str) -> bool:
        return any(file_path.lower().endswith(ext) for ext in ARCHIVE_EXTENSIONS)

    def extract(self, file_path: str) -> ExtractedDocument:
        raise NotImplementedError("Use extract_to_dir() for archives.")

    def extract_to_dir(self, archive_path: str, dest_dir: str) -> List[str]:
        """
        Extract archive to dest_dir. Returns list of extracted file paths.
        """
        if not os.path.exists(archive_path):
            raise ExtractionError(f"Archive not found: {archive_path}")

        os.makedirs(dest_dir, exist_ok=True)

        # Strategy 1: unar (best RAR support on macOS)
        if self._try_unar(archive_path, dest_dir):
            files = self._list_files(dest_dir)
            log.info(f"[ArchiveExtractor] unar extracted {len(files)} files from {os.path.basename(archive_path)}")
            return files

        # Strategy 2: patoolib
        if self._try_patoolib(archive_path, dest_dir):
            files = self._list_files(dest_dir)
            log.info(f"[ArchiveExtractor] patoolib extracted {len(files)} files from {os.path.basename(archive_path)}")
            return files

        # Strategy 3: stdlib zipfile (ZIP only)
        if archive_path.lower().endswith(".zip"):
            if self._try_zipfile(archive_path, dest_dir):
                files = self._list_files(dest_dir)
                log.info(f"[ArchiveExtractor] zipfile extracted {len(files)} files from {os.path.basename(archive_path)}")
                return files

        raise ExtractionError(f"Could not extract archive: {archive_path}. Install unar: brew install unar")

    def _try_unar(self, archive_path: str, dest_dir: str) -> bool:
        unar = shutil.which("unar")
        if not unar:
            return False
        try:
            result = subprocess.run(
                [unar, "-o", dest_dir, "-f", archive_path],
                capture_output=True, text=True, timeout=120
            )
            return result.returncode == 0
        except Exception as e:
            log.warning(f"[ArchiveExtractor] unar failed: {e}")
            return False

    def _try_patoolib(self, archive_path: str, dest_dir: str) -> bool:
        try:
            import patoolib
            patoolib.extract_archive(archive_path, outdir=dest_dir, verbosity=-1)
            return True
        except Exception as e:
            log.warning(f"[ArchiveExtractor] patoolib failed: {e}")
            return False

    def _try_zipfile(self, archive_path: str, dest_dir: str) -> bool:
        try:
            import zipfile
            with zipfile.ZipFile(archive_path, "r") as z:
                z.extractall(dest_dir)
            return True
        except Exception as e:
            log.warning(f"[ArchiveExtractor] zipfile failed: {e}")
            return False

    def _list_files(self, directory: str) -> List[str]:
        """Recursively list all files (not dirs) in directory."""
        result = []
        for root, _, files in os.walk(directory):
            for f in files:
                if not f.startswith("~$") and not f.startswith("."):
                    result.append(os.path.join(root, f))
        return sorted(result)
