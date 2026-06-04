from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ExtractedDocument:
    """
    Output of any extractor.
    raw_text is the primary field — everything else is metadata.
    """
    raw_text: str
    file_path: str
    file_type: str                        # pdf | docx | doc | zip | rar | html
    file_name: str
    file_size_bytes: int
    page_count: Optional[int] = None      # PDF only
    metadata: dict = field(default_factory=dict)
    extraction_method: str = "unknown"    # which extractor produced this
    encoding: Optional[str] = None


class ExtractionError(Exception):
    pass


class BaseExtractor(ABC):
    """
    Abstract base for all document extractors.
    One extractor per file type.
    """

    @abstractmethod
    def can_handle(self, file_path: str) -> bool:
        """Return True if this extractor handles the given file."""
        ...

    @abstractmethod
    def extract(self, file_path: str) -> ExtractedDocument:
        """
        Extract text and metadata from file_path.
        Raises ExtractionError on failure.
        """
        ...
