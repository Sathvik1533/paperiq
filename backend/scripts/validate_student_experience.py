#!/usr/bin/env python3
"""
End-to-End Student Validation
Tests complete flow: Subject Selection → Analysis Execution → Report Generation
Validates student experience for all 10 verified R22 CSE subjects
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
from supabase import create_client
from app.analysis.report_builder import ReportBuilder

load_dotenv()

VERIFIED_SUBJECTS = {
    "A6IT02": "Object Oriented Programming through Java",
    "A6CS28": "Digital Electronics and Computer Organization",
    "A6CS05": "Data Structures",
    "A6CS07": "Software Engineering",
    "A6BS03": "Computer Oriented Statistical Methods",
    "A6HS08": "Business Economics and Financial Analysis",
    "A6CS08": "Discrete Mathematics",
    "A6CS13": "Software Testing Fundamentals",
    "A6CS09": "Database Management Systems",
    "A6CS11": "Operating System",
}

def validate_subject(sb, code, name, builder):
    """Validate complete student experience for one subject"""
    result = {
        "code": code,
        "name": name,
        "questions": 0,
        "units": 0,
        "topics": 0,
        "analysis_status": "❌ NOT TESTED",
        "unit_distribution": False,
        "most_asked_topics": False,
        "coverage_analysis": False,
        "study_priority": False,
        "errors": []
    }
    
    try:
        # Step 1: Check subject exists in database
        subject = sb.table('subjects').select('id, code, name').eq('code', code).eq('regulation', 'R22').execute()
        if not subject.data:
            result['errors'].append("Subject not found in database")
            result['analysis_status'] = "❌ NO SUBJECT"
            return result
        
        subject_id = subject.data[0]['id']
        
        # Step 2: Check question count
        questions = sb.table('questions').select('id', count='exact').eq('subject_id', subject_id).execute()
        result['questions'] = questions.count if questions.count else 0
        
        if result['questions'] == 0:
            result['errors'].append("No questions found")
            result['analysis_status'] = "❌ NO QUESTIONS"
            return result
        
        # Step 3: Execute analysis
        try:
            report = builder.build(
                subject_id=subject_id,
                regulation='R22',
                branch_id=None,
                year_from=None,
                year_to=None
            )
            
            # Step 4: Validate report structure
            if not report:
                result['errors'].append("Analysis returned empty report")
                result['analysis_status'] = "❌ EMPTY REPORT"
                return result
            
            # Step 5: Check unit distribution
            if 'unit_distribution_classified' in report and report['unit_distribution_classified']:
                result['unit_distribution'] = True
                result['units'] = len(report['unit_distribution_classified'])
            else:
                result['errors'].append("No unit distribution returned")
            
            # Step 6: Check most asked topics
            if 'most_asked_topics' in report and report['most_asked_topics']:
                result['most_asked_topics'] = True
                result['topics'] = len(report['most_asked_topics'])
            else:
                result['errors'].append("No topics returned")
            
            # Step 7: Check coverage analysis
            if 'coverage_analysis' in report and report['coverage_analysis']:
                result['coverage_analysis'] = True
            else:
                result['errors'].append("No coverage analysis returned")
            
            # Step 8: Check study priority order
            if 'study_priority_order' in report and report['study_priority_order']:
                result['study_priority'] = True
            else:
                result['errors'].append("No study priority returned")
            
            # Determine overall status
            if all([result['unit_distribution'], result['most_asked_topics'], 
                    result['coverage_analysis'], result['study_priority']]):
                result['analysis_status'] = "✅ COMPLETE"
            elif any([result['unit_distribution'], result['most_asked_topics']]):
                result['analysis_status'] = "⚠️  PARTIAL"
            else:
                result['analysis_status'] = "❌ NO DATA"
            
        except Exception as e:
            result['errors'].append(f"Analysis execution failed: {str(e)}")
            result['analysis_status'] = "❌ FAILED"
    
    except Exception as e:
        result['errors'].append(f"Validation error: {str(e)}")
        result['analysis_status'] = "❌ ERROR"
    
    return result

def main():
    sb = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))
    builder = ReportBuilder()
    
    print("="*120)
    print("END-TO-END STUDENT VALIDATION - ALL 10 R22 CSE SUBJECTS")
    print("="*120)
    print()
    print("Testing: Subject Selection → Analysis Execution → Report Generation")
    print()
    
    results = []
    
    for code, name in VERIFIED_SUBJECTS.items():
        print(f"Testing {code} - {name}...")
        result = validate_subject(sb, code, name, builder)
        results.append(result)
        print(f"  {result['analysis_status']}")
    
    print()
    print("="*120)
    print("VALIDATION RESULTS - EVIDENCE TABLE")
    print("="*120)
    print()
    
    # Evidence table
    print(f"{'Subject':<10} {'Questions':<12} {'Units':<8} {'Topics':<8} {'Analysis Status':<20} {'Issues'}")
    print("-"*120)
    
    complete_subjects = []
    partial_subjects = []
    failed_subjects = []
    
    for r in results:
        issues = len(r['errors'])
        print(f"{r['code']:<10} {r['questions']:<12} {r['units']:<8} {r['topics']:<8} {r['analysis_status']:<20} {issues} issues")
        
        if r['analysis_status'] == "✅ COMPLETE":
            complete_subjects.append(r['code'])
        elif "PARTIAL" in r['analysis_status']:
            partial_subjects.append(r['code'])
        else:
            failed_subjects.append(r['code'])
    
    print()
    print("="*120)
    print("DETAILED VALIDATION BREAKDOWN")
    print("="*120)
    print()
    
    for r in results:
        print(f"{r['code']} - {r['name']}")
        print("-"*120)
        print(f"  Questions: {r['questions']}")
        print(f"  Units: {r['units']}")
        print(f"  Topics: {r['topics']}")
        print(f"  Status: {r['analysis_status']}")
        print()
        print(f"  Feature Validation:")
        print(f"    Unit Distribution:    {'✅' if r['unit_distribution'] else '❌'}")
        print(f"    Most Asked Topics:    {'✅' if r['most_asked_topics'] else '❌'}")
        print(f"    Coverage Analysis:    {'✅' if r['coverage_analysis'] else '❌'}")
        print(f"    Study Priority Order: {'✅' if r['study_priority'] else '❌'}")
        
        if r['errors']:
            print(f"  Errors:")
            for err in r['errors']:
                print(f"    - {err}")
        
        print()
    
    print("="*120)
    print("SUMMARY")
    print("="*120)
    print()
    
    print(f"Complete Subjects ({len(complete_subjects)}/10):")
    for code in complete_subjects:
        print(f"  ✅ {code} - {VERIFIED_SUBJECTS[code]}")
    
    if partial_subjects:
        print()
        print(f"Partial Subjects ({len(partial_subjects)}/10):")
        for code in partial_subjects:
            print(f"  ⚠️  {code} - {VERIFIED_SUBJECTS[code]}")
    
    if failed_subjects:
        print()
        print(f"Failed Subjects ({len(failed_subjects)}/10):")
        for code in failed_subjects:
            print(f"  ❌ {code} - {VERIFIED_SUBJECTS[code]}")
    
    print()
    print("Student Experience Validation:")
    
    if len(complete_subjects) >= 8:
        print("  ✅ PASS - 8+ subjects provide complete student experience")
        print(f"     {len(complete_subjects)}/10 subjects fully functional")
    elif len(complete_subjects) >= 5:
        print("  ⚠️  ACCEPTABLE - 5+ subjects provide complete experience")
        print(f"     {len(complete_subjects)}/10 subjects fully functional")
        print("     Some subjects need attention")
    else:
        print("  ❌ FAIL - Less than 5 subjects functional")
        print(f"     Only {len(complete_subjects)}/10 subjects working")
        print("     Critical issues detected")
    
    print()
    print("="*120)
    print("CONCLUSION")
    print("="*120)
    print()
    
    total_questions = sum(r['questions'] for r in results)
    avg_units = sum(r['units'] for r in results if r['units'] > 0) / len([r for r in results if r['units'] > 0]) if any(r['units'] > 0 for r in results) else 0
    avg_topics = sum(r['topics'] for r in results if r['topics'] > 0) / len([r for r in results if r['topics'] > 0]) if any(r['topics'] > 0 for r in results) else 0
    
    print(f"Total Questions Available: {total_questions}")
    print(f"Average Units per Subject: {avg_units:.1f}")
    print(f"Average Topics per Subject: {avg_topics:.1f}")
    print()
    
    if len(complete_subjects) >= 8:
        print("✅ MVP READY FOR STUDENT TESTING")
        print(f"   {len(complete_subjects)}/10 subjects provide complete analysis")
        print("   All critical features validated")
    else:
        print("⚠️  MVP NEEDS ATTENTION")
        print(f"   Only {len(complete_subjects)}/10 subjects complete")
        print("   Review failed subjects before student testing")
    
    print()

if __name__ == "__main__":
    main()
