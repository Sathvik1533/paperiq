#!/usr/bin/env python3
"""
Test hall ticket parser with sample hall ticket text
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.extractors.hall_ticket_parser import parse_hall_ticket

# Sample hall ticket text (from the images provided)
SAMPLE_HALL_TICKET_2_1 = """
MARRI LAXMAN REDDY MLR
Institute of Technology

II B.Tech. I Semester SUPPLEMENTARY (R-22) June 2026 EXAMINATIONS

CSE                                HALLTICKET

Hall Ticket No:    25R25A0538

Name:              Mr.KURALLA SAI SIDDHI HARSHA SRAVAN
Father Name:       Mr.KURALLA SURYA PRAKASH

Date       Time              Subject Code    Registered Subjects
09/06/2026 10:00AM to 01:00PM A6IT02         Object Oriented Programming through Java
11/06/2026 10:00AM to 01:00PM A6CS28         Digital Electronics and Computer Organization
13/06/2026 10:00AM to 01:00PM A6CS05         Data Structures
16/06/2026 10:00AM to 01:00PM A6CS07         Software Engineering
20/06/2026 10:00AM to 01:00PM A6BS03         Computer Oriented Statistical Methods
"""

SAMPLE_HALL_TICKET_2_2 = """
MARRI LAXMAN REDDY MLR
Institute of Technology

II B.Tech. II Semester REGULAR (R-22) June 2026 EXAMINATIONS

CSE                                HALLTICKET

Hall Ticket No:    24FR21A05HR

Name:              Mr.KOTAGIRI SATHWIK
Father Name:       Mr.KOTAGIRI RAGHAVENDER

Date       Time              Subject Code    Registered Subjects
08/06/2026 10:00AM to 01:00PM A6HS08         Business Economics and Financial Analysis
10/06/2026 10:00AM to 01:00PM A6CS08         Discrete Mathematics
12/06/2026 10:00AM to 01:00PM A6CS13         Software Testing Fundamentals
15/06/2026 10:00AM to 01:00PM A6CS09         Database Management Systems
17/06/2026 10:00AM to 01:00PM A6CS11         Operating System
"""

def test_parser():
    print("=" * 70)
    print("HALL TICKET PARSER TEST")
    print("=" * 70)
    print()
    
    print("TEST 1: II B.Tech I Semester (2-1)")
    print("-" * 70)
    result = parse_hall_ticket(SAMPLE_HALL_TICKET_2_1)
    
    print(f"Branch: {result['branch']}")
    print(f"Regulation: {result['regulation']}")
    print(f"Year: {result['year']}, Semester: {result['semester']}")
    print(f"Display: {result['semester_display']}")
    print(f"Confidence: {result['confidence']}")
    print(f"\nSubjects ({len(result['subjects'])}):")
    for subj in result['subjects']:
        print(f"  ✓ {subj['code']} - {subj['name']}")
    
    print()
    print("TEST 2: II B.Tech II Semester (2-2)")
    print("-" * 70)
    result2 = parse_hall_ticket(SAMPLE_HALL_TICKET_2_2)
    
    print(f"Branch: {result2['branch']}")
    print(f"Regulation: {result2['regulation']}")
    print(f"Year: {result2['year']}, Semester: {result2['semester']}")
    print(f"Display: {result2['semester_display']}")
    print(f"Confidence: {result2['confidence']}")
    print(f"\nSubjects ({len(result2['subjects'])}):")
    for subj in result2['subjects']:
        print(f"  ✓ {subj['code']} - {subj['name']}")
    
    print()
    print("=" * 70)
    print("✅ PARSER TEST COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    test_parser()
