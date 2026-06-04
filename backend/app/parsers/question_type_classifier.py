import re
from app.parsers.models import QuestionType

_RULES: list[tuple[QuestionType, float, list[str]]] = [
    (QuestionType.PROOF, 0.95, [
        r"\bprove\b", r"\bproof\b", r"\bshow that\b", r"\bverify\b",
        r"\bdemonstrate\b", r"\bestablish that\b", r"\bjustify\b",
    ]),
    (QuestionType.DEFINITION, 0.95, [
        r"\bdefine\b", r"\bwhat is\b", r"\bwhat are\b",
        r"\bstate the definition\b", r"\bgive the definition\b",
        r"\blist the properties\b", r"\blist.*properties\b",
    ]),
    (QuestionType.CONSTRUCTION, 0.92, [
        r"\bdraw\b", r"\bconstruct\b", r"\bsketch\b",
        r"\bdraw the hasse\b", r"\bdraw.*diagram\b",
        r"\bapply kruskal\b", r"\bkruskal'?s algorithm\b",
        r"\bfind.*minimum spanning\b", r"\bminimum spanning tree\b",
    ]),
    (QuestionType.NUMERICAL, 0.90, [
        r"\bsolve\b", r"\bfind\b", r"\bcalculate\b", r"\bcompute\b",
        r"\bdetermine the (?:value|number|coefficient|sum)\b",
        r"\bhow many\b", r"\bin how many ways\b",
        r"\bexpand\b", r"\bevaluate\b",
        r"\bsolve.*recurrence\b", r"\bcharacteristic roots?\b",
        r"\bgenerating function\b.*\bsolve\b",
    ]),
    (QuestionType.COMPARISON, 0.88, [
        r"\bcompare\b", r"\bdifferentiate\b", r"\bdistinguish\b",
        r"\bdifference between\b", r"\bsimilarities\b",
    ]),
    (QuestionType.THEORY, 0.85, [
        r"\bexplain\b", r"\bdescribe\b", r"\bdiscuss\b",
        r"\bstate and explain\b", r"\billustrate\b", r"\belaborate\b",
        r"\bwrite.*about\b", r"\bwrite.*note\b", r"\bbriefly explain\b",
        r"\bwith.*example\b",
    ]),
    (QuestionType.PROBLEM, 0.80, [
        r"\bdetermine\b", r"\bcheck\b", r"\bexamine\b",
        r"\bverify whether\b", r"\btest whether\b",
        r"\bapply\b", r"\busing\b.*\balgorithm\b",
    ]),
]

_COMPILED: list[tuple[QuestionType, float, list[re.Pattern]]] = [
    (qt, conf, [re.compile(p, re.I) for p in patterns])
    for qt, conf, patterns in _RULES
]


def classify_question_type(text: str) -> tuple[QuestionType, float]:
    if not text or not text.strip():
        return QuestionType.UNKNOWN, 0.0
    text_lower = text.lower().strip()
    text_start = text_lower[:120]
    for qt, confidence, patterns in _COMPILED:
        for pattern in patterns:
            if pattern.search(text_start):
                return qt, confidence
            if pattern.search(text_lower):
                return qt, confidence * 0.85
    return QuestionType.UNKNOWN, 0.3
