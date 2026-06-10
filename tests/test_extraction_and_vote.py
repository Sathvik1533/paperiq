import os
import tempfile
import zipfile
from pathlib import Path

import pytest

from backend.app.utils.extraction import extract_file

def test_extract_file_single_docx():
    # Create a temporary zip archive with a single DOCX file
    with tempfile.TemporaryDirectory() as tmp_dir:
        zip_path = Path(tmp_dir) / "sample.zip"
        docx_name = "sample.docx"
        docx_content = b"test content"
        # Write zip containing the docx
        with zipfile.ZipFile(zip_path, "w") as zf:
            zf.writestr(docx_name, docx_content)

        # Use the utility to extract the specific file
        extracted_path = extract_file(zip_path, docx_name)
        assert extracted_path.exists()
        # Verify the content matches
        with open(extracted_path, "rb") as f:
            assert f.read() == docx_content
