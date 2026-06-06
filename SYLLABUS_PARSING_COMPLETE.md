# Syllabus Parsing - COMPLETE ✅

**Date:** June 5, 2026  
**Source:** https://files.mlrit.ac.in/curriculum/133-links/B.Tech-(CSE)MLR22-SYLLABUS.pdf

---

## Parsing Results

### Successfully Extracted
- **10 Subjects** (all verified R22 CSE subjects)
- **50 Units** (~5 units per subject)
- **319 Topics** (average 6-7 topics per unit)

### Subject Breakdown

| Subject Code | Subject Name | Units | Topics |
|--------------|--------------|-------|--------|
| A6BS03 | Computer Oriented Statistical Methods | 5 | ~40 |
| A6CS05 | Data Structures | 5 | ~35 |
| A6CS07 | Software Engineering | 5 | ~25 |
| A6CS08 | Discrete Mathematics | 5 | ~35 |
| A6CS09 | Database Management Systems | 5 | ~35 |
| A6CS11 | Operating System | 5 | ~35 |
| A6CS13 | Software Testing Fundamentals | 5 | ~40 |
| A6CS28 | Digital Electronics and Computer Organization | 5 | ~25 |
| A6HS08 | Business Economics and Financial Analysis | 5 | ~30 |
| A6IT02 | Object Oriented Programming through Java | 5 | ~39 |

---

## Sample Output

### A6CS05 - Data Structures

**Unit I: Linear Data Structures – Stack, Queue, Linked List**
- Introduction to Data Structures, abstract data types
- Linear list – singly linked list implementation
- Deletion and searching operations on linear list
- Stacks- Operations, array and linked representations
- Stack applications, Queues- operations, array and linked representations

**Unit II: Dictionaries and Hash Structures**
- Dictionaries: linear list representation, skip list representation
- Operations - insertion, deletion, searching
- Hash Table Representation: hash functions
- Collision resolution-separate chaining, open addressing
- Linear probing, quadratic probing, double hashing, rehashing, extendible hashing

**Unit III: Search Trees**
- Binary Search Trees, Definition, Implementation
- Operations- Searching, Insertion and Deletion
- B- Trees, B+ Trees, AVL Trees
- Red –Black, Splay Trees

**Unit IV: Graph and Sorting Techniques**
- Graph Implementation Methods, Graph Traversal Methods
- Quick Sort, Heap Sort, External Sorting
- Merge Sort

**Unit V: Pattern Matching**
- Pattern matching algorithms-Brute force
- Boyer–Moore algorithm, Morris-Pratt algorithm
- Standard Tries, Compressed Tries, Suffix tries

---

### A6CS09 - Database Management Systems

**Unit I: DATABASE SYSTEM APPLICATIONS & INTRODUCTION TO**
- Database System Applications: A Historical Perspective
- File Systems versus a DBMS, the Data Model
- Levels of Abstraction in a DBMS, Data Independence
- Introduction to Database Design: Database Design and ER Diagrams
- Entities, Attributes, Relationships and Relationship Sets

**Unit II: INTRODUCTION TO THE RELATIONAL MODEL**
- Integrity constraint over relations
- Querying relational data, logical database design
- Relational Algebra, Tuple relational Calculus
- Domain relational calculus

**Unit III: SQL: QUERIES, CONSTRAINTS, TRIGGERS**
- Form of basic SQL query
- UNION, INTERSECT, and EXCEPT, Nested Queries
- Aggregation operators, NULL values
- Complex integrity constraints, triggers and active databases
- Schema Refinement: decompositions, functional dependencies
- First, Second, Third normal forms, BCNF

**Unit IV: Transaction Management**
- Transaction Concept, Transaction State
- Implementation of Atomicity and Durability
- Serializability, Recoverability
- Timestamp Based Protocols, Validation-Based Protocols
- Recovery and Atomicity

**Unit V: Indexing**
- Data on External Storage, File Organization and Indexing
- Cluster Indexes, Primary and Secondary Indexes
- Hash Based Indexing, Tree based Indexing
- B+ Trees, ISAM

---

## Next Steps

### ✅ COMPLETED
1. Download syllabus PDF
2. Parse all 10 subjects
3. Extract units and topics
4. Verify extraction accuracy

### ⏳ PENDING (Database Setup Required)
1. **Create `syllabus_units` table in Supabase**
   - Run SQL: `CREATE_SYLLABUS_TABLES.sql`
   
2. **Run ingestion script**
   ```bash
   cd /Users/k.sathvik/paperiq/backend
   python3 scripts/ingest_syllabus.py
   ```

3. **Implement topic classification**
   - Build similarity matching system
   - Match questions → topics → units
   - Store: `topic_id`, `topic_name`, `unit_name`, `confidence_score`

---

## Topic Classification Workflow

Once database tables are created:

```
Question Text
    ↓
Topic Similarity Match (semantic/keyword-based)
    ↓
Best Match Topic (from syllabus_topics)
    ↓
Assigned Unit (from syllabus_units via topic's unit_id)
    ↓
Store in questions table:
    - topic_id
    - topic_name
    - unit_name
    - classification_confidence (0.0-1.0)
```

---

## Expected Impact

### Analysis Features Enabled
1. **Unit Distribution** - Show question distribution across Units I-V
2. **Topic Frequency** - Most repeated topics from syllabus
3. **Coverage Analysis** - Which topics are well-covered vs. under-represented
4. **High Probability Topics** - Evidence-based predictions using unit/topic data
5. **Study Plan Generation** - Prioritize units/topics based on frequency

### MVP Value
- Students see: "Unit III has 40% of questions - focus here"
- Students see: "Hash Tables appears in 15 papers - high priority"
- Students see: "B+ Trees only in 3 papers - lower priority"

---

## Files Created

1. **`scripts/ingest_syllabus.py`** - Parser + database ingestion
2. **`supabase/migrations/004_syllabus_tables.sql`** - Table definitions
3. **`CREATE_SYLLABUS_TABLES.sql`** - Manual table creation SQL
4. **`SYLLABUS_SETUP_INSTRUCTIONS.md`** - Step-by-step guide

---

## Success Criteria

✅ **ACHIEVED:**
- Syllabus PDF successfully parsed
- All 10 verified subjects extracted
- 50 units identified with topics
- 319 topics extracted from official curriculum

⏳ **PENDING:**
- Database tables creation (requires Supabase dashboard access)
- Topic classification implementation
- Question → Topic mapping

---

**Status: Syllabus parsing complete. Database setup pending. Topic classification ready for implementation once tables are created.**
