import patoolib
import rarfile
import zipfile
from pathlib import Path
import logging

log = logging.getLogger(__name__)

def extract_archive(archive_path: Path, dest_dir: Path) -> bool:
    """Extract an archive (.rar or .zip) to ``dest_dir``.
    Handles ZIP files using the standard library's ``zipfile`` module to avoid
    external dependencies. For RAR files, attempts ``rarfile`` extraction first;
    if that fails, falls back to ``patool`` which can invoke external tools.
    Returns ``True`` on success, raises ``RuntimeError`` on failure.
    """
    archive_path = archive_path.resolve()
    dest_dir = dest_dir.resolve()
    dest_dir.mkdir(parents=True, exist_ok=True)
    # Handle ZIP archives directly with zipfile (no external binaries needed)
    if archive_path.suffix.lower() == ".zip":
        try:
            with zipfile.ZipFile(str(archive_path), 'r') as zf:
                zf.extractall(str(dest_dir))
            log.info("Extracted archive using zipfile: %s", archive_path)
            return True
        except Exception as zip_err:
            raise RuntimeError(f"Failed to extract zip archive {archive_path}: {zip_err}")
    # Attempt RAR extraction via rarfile
    try:
        with rarfile.RarFile(str(archive_path)) as rf:
            rf.extractall(str(dest_dir))
        log.info("Extracted archive using rarfile: %s", archive_path)
        return True
    except (rarfile.RarCannotExec, rarfile.Error) as e:
        log.warning("rarfile extraction failed (%s), falling back to patool", e)
        try:
            patoolib.extract_archive(str(archive_path), outdir=str(dest_dir))
            log.info("Extracted archive using patool: %s", archive_path)
            return True
        except Exception as patool_err:
            raise RuntimeError(f"Failed to extract archive {archive_path}: {patool_err}")

def extract_file(archive_path: Path, file_name: str) -> Path:
    """Extract a single file from a .rar or .zip archive.

    The function extracts the archive to a temporary directory,
    searches for *file_name* (case‑insensitive) and returns the
    absolute path to the extracted file. Raises ``FileNotFoundError``
    if the file is not present in the archive.
    """
    import tempfile
    import shutil
    # Create temporary extraction dir
    temp_dir = Path(tempfile.mkdtemp())
    try:
        # Use existing archive extraction logic
        if not extract_archive(archive_path, temp_dir):
            raise RuntimeError(f"Failed to extract archive {archive_path}")
        # Search for the target file (case‑insensitive)
        for path in temp_dir.rglob('*'):
            if path.is_file() and path.name.lower() == file_name.lower():
                # Copy to a stable location before cleaning up
                dest = Path(tempfile.gettempdir()) / f"extracted_{file_name}"
                shutil.copy(str(path), str(dest))
                return dest
        raise FileNotFoundError(f"File {file_name} not found in archive {archive_path}")
    finally:
        # Clean up the temporary extraction directory
        shutil.rmtree(str(temp_dir), ignore_errors=True)
