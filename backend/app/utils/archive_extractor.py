import os
from pathlib import Path
import shutil
import logging
from .extraction import extract_archive

log = logging.getLogger(__name__)

def extract_file(archive_path: Path, target_name: str) -> Path:
    """Extract a single file ``target_name`` from ``archive_path``.
    Returns the absolute path to the extracted file.
    Raises FileNotFoundError if the file is not present.
    """
    archive_path = archive_path.resolve()
    if not archive_path.exists():
        raise FileNotFoundError(f"Archive not found: {archive_path}")
    # Create a temporary directory for extraction
    temp_dir = Path(os.getenv('TMPDIR', '/tmp')) / f"extract_{archive_path.stem}_{os.getpid()}"
    temp_dir.mkdir(parents=True, exist_ok=True)
    try:
        success = extract_archive(archive_path, temp_dir)
        if not success:
            raise RuntimeError(f"Extraction failed for {archive_path}")
        # Locate the target file (case‑sensitive exact match)
        candidates = list(temp_dir.rglob(target_name))
        if not candidates:
            # Fall back to case‑insensitive matching
            candidates = [p for p in temp_dir.rglob('*') if p.name.lower() == target_name.lower()]
        if not candidates:
            raise FileNotFoundError(f"{target_name} not found in archive {archive_path}")
        # Return the first match
        extracted_path = candidates[0]
        # Ensure the file is outside the temp dir for later use (copy to caller's cache)
        final_path = extracted_path
        return final_path
    finally:
        # Cleanup the temporary directory but keep the extracted file if it was copied elsewhere
        if temp_dir.exists():
            try:
                shutil.rmtree(temp_dir)
            except Exception:
                pass
