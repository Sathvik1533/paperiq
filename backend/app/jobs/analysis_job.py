"""
Background job wrapper around ReportBuilder.
"""
from typing import Optional
from app.analysis.report_builder import ReportBuilder
from app.logger import get_logger

log = get_logger(__name__)


async def run_analysis_job(
    subject_id: str,
    regulation: str,
    branch_id: Optional[str] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
) -> dict:
    """
    Async wrapper — runs ReportBuilder synchronously inside an async context.
    Returns the full report dict.
    """
    log.info(
        f"run_analysis_job: subject={subject_id} reg={regulation} "
        f"branch={branch_id} years={year_from}-{year_to}"
    )
    builder = ReportBuilder()
    report = builder.build(
        subject_id=subject_id,
        regulation=regulation,
        branch_id=branch_id,
        year_from=year_from,
        year_to=year_to,
    )
    log.info(f"run_analysis_job complete: report_id={report['id']}")
    return report
