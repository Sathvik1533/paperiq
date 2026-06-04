import pytest
from app.parsers.question_parser import QuestionParser
from app.parsers.question_type_classifier import classify_question_type
from app.parsers.marks_extractor import extract_marks
from app.parsers.models import QuestionType, QuestionSection

PAPER_ID   = "test-paper-00000000-0000-0000-0000-000000000001"
SUBJECT_ID = "c0000000-0000-0000-0000-000000000001"

REAL_PAPER_TEXT = """Course Code: A6CS08
MLR INSTITUTE OF TECHNOLOGY
(An Autonomous Institution)
II B.Tech I Semester Regular Examinations, February-2024
DISCRETE MATHEMATICS
(Common to CSC, CSD, CSIT, CSM & IT)
Time: 3 Hours. Max. Marks: 60
Note: 1. This question paper contains two parts A and B.
PART- A 10 x 1M=10Marks
PART- B 5 x 10M=50Marks
---oo0oo---
H.T NO. | R | 2 | R22
1. | a) | Write converse, opposite for the statement \"If 2+2=8 then sun rises in the east\" | 1M | CO1 | BL1
1. | b) | Define propositional logic? | 1M | CO1 | BL1
1. | c) | Give a suitable example for a relation, when is not equivalence. | 1M | CO2 | BL1
1. | d) | What is on-to function? | 1M | CO2 | BL1
1. | e) | Define permutation. | 1M | CO3 | BL1
1. | f) | In how many ways can the letters of the English alphabet be arranged so that there are exactly 5 letters between the letters a and b? | 1M | CO3 | BL1
1. | g) | What is homogeneous recurrence relation? | 1M | CO4 | BL1
1. | h) | Define generating function. | 1M | CO4 | BL1
1. | i) | What is tree? | 1M | CO5 | BL1
1. | j) | What is an Euler graph? | 1M | CO5 | BL1
PART- B 5 x 10M = 50Marks
2 | a) | Check whether the following proposition is tautology or contradiction | 5M | CO1 | BL3
2 | b) | Show that ~P follows from the set of premises using indirect method of proof. | 5M | CO1 | BL3
OR
3 | a) | Use truth table to show that the given proposition is tautology | 5M | CO1 | BL3
3 | b) | Show that the following statement is tautology or not | 5M | CO1 | BL3
4 | a) | Draw the Hasse diagram for the partial ordering on the power set e(S) where S={a,b,c}. | 5M | CO2 | BL2
4 | b) | Define lattice and find Least Upper Bound (LUB) and Greatest Lower Bound (GLB) for D18. | 5M | CO2 | BL1
OR
5 | a) | Draw the Hasse diagram for and relation <= be such that x<=y, if x divides y. | 5M | CO2 | BL2
5 | b) | Define monoid. Consider an algebraic system where a set N={0,1,2} and + is addition, determine (N,+) is a monoid or not. | 5M | CO2 | BL3
6 | Determine the coefficient of x4 and x5 in (a+bx+cx2)10. | 10M | CO3 | BL3
OR
7 | a) | Use multinomial theorem to expand (x1+x2+x3+x4)4. | 5M | CO3 | BL3
7 | b) | How many 5 letter words are there where first and last letters are vowels. | 5M | CO3 | BL2
8 | Solve the recurrence relation an -9an-1 + 20an-2 = 0 with a0 = -3, a1 = -10 using generating functions. | 10M | CO4 | BL3
OR
9 | a) | Solve the following recurrence relation using characteristic roots an + 6an-1 + 8an-2 = 0 and a0=2, a1 = -7. | 5M | CO4 | BL3
9 | b) | Solve the recurrence relation un+2 - un+1 - 12un=0, u1=13, u0=0. | 5M | CO4 | BL3
10 | a) | Explain BFS method for finding a spanning tree with an example. | 5M | CO5 | BL2
10 | b) | Examine whether the following Graphs G1 and G2 are isomorphic or not | 5M | CO5 | BL3
OR
11 | a) | Construct minimum spanning tree for the following graph using Kruskal's algorithm. | 5M | CO5 | BL2
11 | b) | Find the chromatic number of the following (i) cn, (ii) kn and (iii) km,n | 5M | CO5 | BL3
"""


class TestQuestionTypeClassifier:
    def test_classifies_definition(self):
        qt, conf = classify_question_type("Define propositional logic")
        assert qt == QuestionType.DEFINITION and conf >= 0.90

    def test_classifies_proof(self):
        qt, conf = classify_question_type("Show that ~P follows from the premises")
        assert qt == QuestionType.PROOF and conf >= 0.90

    def test_classifies_numerical(self):
        qt, conf = classify_question_type("Solve the recurrence relation an - 9an-1")
        assert qt == QuestionType.NUMERICAL and conf >= 0.85

    def test_classifies_construction(self):
        qt, conf = classify_question_type("Draw the Hasse diagram for positive divisors of 45")
        assert qt == QuestionType.CONSTRUCTION and conf >= 0.88

    def test_classifies_theory(self):
        qt, conf = classify_question_type("Explain BFS method for finding a spanning tree")
        assert qt == QuestionType.THEORY and conf >= 0.80

    def test_classifies_numerical_howmany(self):
        qt, _ = classify_question_type("In how many ways can letters be arranged")
        assert qt == QuestionType.NUMERICAL

    def test_returns_unknown_for_empty(self):
        qt, conf = classify_question_type("")
        assert qt == QuestionType.UNKNOWN and conf == 0.0

    def test_proof_kruskal(self):
        qt, _ = classify_question_type("Construct minimum spanning tree using Kruskal's algorithm")
        assert qt == QuestionType.CONSTRUCTION

    def test_comparison(self):
        qt, _ = classify_question_type("Differentiate between Euler graph and Hamiltonian graph")
        assert qt == QuestionType.COMPARISON


class TestMarksExtractor:
    def test_extracts_5M(self):
        val, _ = extract_marks("Prove the theorem | 5M | CO1")
        assert val == 5

    def test_extracts_10M(self):
        val, _ = extract_marks("Solve recurrence relation | 10M | CO4")
        assert val == 10

    def test_extracts_1M(self):
        val, _ = extract_marks("Define tautology | 1M | CO1 | BL1")
        assert val == 1

    def test_extracts_marks_word(self):
        val, _ = extract_marks("Explain with 7 Marks")
        assert val == 7

    def test_returns_none_when_absent(self):
        val, text = extract_marks("Some question with no marks info")
        assert val is None and text == ""

    def test_ignores_invalid_marks(self):
        val, _ = extract_marks("Question (99M)")
        assert val is None


class TestQuestionParser:
    def setup_method(self):
        self.parser = QuestionParser()

    def test_parses_real_paper(self):
        result = self.parser.parse(REAL_PAPER_TEXT, PAPER_ID, SUBJECT_ID)
        assert result.total_questions > 0

    def test_extracts_part_a_questions(self):
        result = self.parser.parse(REAL_PAPER_TEXT, PAPER_ID, SUBJECT_ID)
        assert result.part_a_count >= 5

    def test_extracts_part_b_questions(self):
        result = self.parser.parse(REAL_PAPER_TEXT, PAPER_ID, SUBJECT_ID)
        assert result.part_b_count >= 5

    def test_question_has_marks(self):
        result = self.parser.parse(REAL_PAPER_TEXT, PAPER_ID, SUBJECT_ID)
        part_b = [q for q in result.questions if q.section == QuestionSection.PART_B]
        assert sum(1 for q in part_b if q.marks is not None) >= 3

    def test_question_has_type(self):
        result = self.parser.parse(REAL_PAPER_TEXT, PAPER_ID, SUBJECT_ID)
        assert sum(1 for q in result.questions if q.question_type != QuestionType.UNKNOWN) > 0

    def test_or_questions_marked(self):
        result = self.parser.parse(REAL_PAPER_TEXT, PAPER_ID, SUBJECT_ID)
        assert sum(1 for q in result.questions if q.is_or_question) >= 1

    def test_hasse_diagram_detected(self):
        result = self.parser.parse(REAL_PAPER_TEXT, PAPER_ID, SUBJECT_ID)
        assert any("hasse" in q.question_text.lower() for q in result.questions)

    def test_kruskal_detected(self):
        result = self.parser.parse(REAL_PAPER_TEXT, PAPER_ID, SUBJECT_ID)
        assert any("kruskal" in q.question_text.lower() for q in result.questions)

    def test_recurrence_relation_detected(self):
        result = self.parser.parse(REAL_PAPER_TEXT, PAPER_ID, SUBJECT_ID)
        assert any("recurrence" in q.question_text.lower() for q in result.questions)

    def test_no_duplicate_questions(self):
        result = self.parser.parse(REAL_PAPER_TEXT, PAPER_ID, SUBJECT_ID)
        hashes = [q.question_hash for q in result.questions]
        assert len(hashes) == len(set(hashes))

    def test_traceability_paper_id(self):
        result = self.parser.parse(REAL_PAPER_TEXT, PAPER_ID, SUBJECT_ID)
        assert all(q.paper_id == PAPER_ID for q in result.questions)

    def test_traceability_raw_snippet(self):
        result = self.parser.parse(REAL_PAPER_TEXT, PAPER_ID, SUBJECT_ID)
        assert sum(1 for q in result.questions if q.raw_snippet) >= len(result.questions) // 2

    def test_question_has_normalized_text(self):
        result = self.parser.parse(REAL_PAPER_TEXT, PAPER_ID, SUBJECT_ID)
        for q in result.questions:
            assert q.normalized_text and q.normalized_text == q.normalized_text.lower()

    def test_question_has_hash(self):
        result = self.parser.parse(REAL_PAPER_TEXT, PAPER_ID, SUBJECT_ID)
        assert all(len(q.question_hash) == 64 for q in result.questions)

    def test_parse_confidence_in_range(self):
        result = self.parser.parse(REAL_PAPER_TEXT, PAPER_ID, SUBJECT_ID)
        assert all(0.0 <= q.parse_confidence <= 1.0 for q in result.questions)

    def test_empty_text_returns_warning(self):
        result = self.parser.parse("", PAPER_ID)
        assert result.total_questions == 0 and len(result.parse_warnings) > 0

    def test_definition_classify_end_to_end(self):
        result = self.parser.parse(REAL_PAPER_TEXT, PAPER_ID, SUBJECT_ID)
        assert sum(1 for q in result.questions if q.question_type == QuestionType.DEFINITION) >= 2

    def test_proof_classify_end_to_end(self):
        result = self.parser.parse(REAL_PAPER_TEXT, PAPER_ID, SUBJECT_ID)
        assert sum(1 for q in result.questions if q.question_type == QuestionType.PROOF) >= 1

    def test_co_extracted(self):
        result = self.parser.parse(REAL_PAPER_TEXT, PAPER_ID, SUBJECT_ID)
        assert sum(1 for q in result.questions if q.co) >= 3
