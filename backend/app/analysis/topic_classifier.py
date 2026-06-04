"""
Topic Classifier — maps question text to topic names for Discrete Mathematics.
Covers Units 1-5 with keyword dictionaries.
"""
from typing import Optional
from app.logger import get_logger

log = get_logger(__name__)

# Each entry: (keywords_list, topic_name, unit)
_TOPIC_KEYWORDS: list[tuple[list[str], str, int]] = [
    # Unit 1 — Mathematical Logic
    (["tautology"], "Tautology", 1),
    (["contradiction"], "Contradiction", 1),
    (["pcnf", "principal conjunctive", "conjunctive normal form"], "PCNF", 1),
    (["pdnf", "principal disjunctive", "disjunctive normal form"], "PDNF", 1),
    (["logical equivalence", "logically equivalent"], "Logical Equivalence", 1),
    (["rules of inference", "rule of inference", "modus ponens", "modus tollens",
      "hypothetical syllogism", "disjunctive syllogism"], "Rules of Inference", 1),
    (["indirect proof", "proof by contradiction", "proof by contrapositive"], "Indirect Proof", 1),
    (["converse", "contrapositive", "inverse of implication"], "Converse/Contrapositive", 1),
    (["predicate", "quantifier", "universal quantifier", "existential quantifier",
      "for all", "there exists"], "Predicate Logic", 1),
    (["proposition", "propositional logic", "truth table"], "Propositional Logic", 1),

    # Unit 2 — Relations & Lattices
    (["hasse diagram", "hasse"], "Hasse Diagram", 2),
    (["equivalence relation", "equivalence class"], "Equivalence Relation", 2),
    (["lattice", "bounded lattice", "complemented lattice", "distributive lattice"], "Lattice", 2),
    (["partial order", "partial ordering", "poset", "partially ordered"], "Partial Order", 2),
    (["binary relation", "relation on set"], "Binary Relations", 2),
    (["function", "bijection", "injection", "surjection", "onto", "one-to-one",
      "composition of function"], "Functions", 2),
    (["monoid"], "Monoid", 2),
    (["group", "abelian group", "cyclic group", "subgroup", "group homomorphism"], "Group", 2),
    (["reflexive", "symmetric", "transitive", "antisymmetric"], "Relation Properties", 2),

    # Unit 3 — Combinatorics
    (["permutation", "arrangement", "npr", "p(n"], "Permutations", 3),
    (["combination", "selection", "ncr", "c(n"], "Combinations", 3),
    (["pigeonhole", "pigeon hole"], "Pigeonhole Principle", 3),
    (["multinomial", "multinomial theorem", "multinomial coefficient"], "Multinomial Theorem", 3),
    (["inclusion-exclusion", "inclusion exclusion", "principle of inclusion"], "Inclusion-Exclusion", 3),
    (["committee", "team of", "select a group", "choose a committee"], "Committee Problems", 3),
    (["binomial theorem", "binomial coefficient", "pascal"], "Binomial Theorem", 3),
    (["counting", "how many ways", "number of ways"], "Counting Principles", 3),

    # Unit 4 — Recurrence Relations
    (["recurrence relation", "recurrence"], "Recurrence Relations", 4),
    (["characteristic root", "characteristic equation"], "Characteristic Roots", 4),
    (["generating function", "ordinary generating function", "exponential generating"],
     "Generating Functions", 4),
    (["homogeneous recurrence", "homogeneous linear"], "Homogeneous Recurrence", 4),
    (["fibonacci", "fibonacci sequence"], "Recurrence Relations", 4),
    (["particular solution", "non-homogeneous"], "Non-Homogeneous Recurrence", 4),

    # Unit 5 — Graph Theory
    (["graph isomorphism", "isomorphic graph"], "Graph Isomorphism", 5),
    (["kruskal", "kruskal's algorithm"], "Kruskal's Algorithm", 5),
    (["prim", "prim's algorithm"], "Prim's Algorithm", 5),
    (["bfs", "breadth first", "breadth-first"], "BFS/DFS", 5),
    (["dfs", "depth first", "depth-first"], "BFS/DFS", 5),
    (["chromatic number", "chromatic polynomial", "graph coloring", "colouring"], "Chromatic Number", 5),
    (["spanning tree", "minimum spanning tree", "mst"], "Spanning Tree", 5),
    (["planar graph", "planarity", "kuratowski", "is planar", "planar"], "Planar Graph", 5),
    (["euler graph", "eulerian", "euler path", "euler circuit"], "Euler Graph", 5),
    (["hamiltonian", "hamiltonian path", "hamiltonian cycle"], "Hamiltonian Graph", 5),
    (["bipartite", "complete bipartite"], "Bipartite Graph", 5),
    (["degree sequence", "handshaking lemma", "degree of vertex"], "Degree Sequence", 5),
    (["tree", "rooted tree", "binary tree", "binary search tree"], "Trees", 5),
    (["connected graph", "disconnected", "connected component"], "Graph Connectivity", 5),
]


def classify_topics(question_text: str, unit: Optional[int] = None) -> list[str]:
    """
    Returns list of matched topic names for the given question text.
    If unit is provided, only returns topics for that unit (more precise).
    """
    text_lower = question_text.lower()
    found: dict[str, bool] = {}

    for keywords, topic, topic_unit in _TOPIC_KEYWORDS:
        # If unit is known, skip topics from other units
        if unit is not None and topic_unit != unit:
            continue
        for kw in keywords:
            if kw in text_lower:
                found[topic] = True
                break

    # No fallback when unit is provided — keep results unit-scoped

    return list(found.keys())
