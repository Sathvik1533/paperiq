"""
Hall Ticket Parser — extracts student profile from hall ticket PDF/image
"""
import re
from typing import Optional
from app.logger import get_logger

log = get_logger(__name__)


class HallTicketParser:
    """Parse MLRIT hall tickets to extract student profile data"""
    
    # Subject code pattern: A6XX## where XX is 2 letters, ## is 2 digits
    SUBJECT_CODE_PATTERN = r'(A6[A-Z]{2}\d{2})'
    
    # Known subject mappings (from verified hall tickets)
    SUBJECT_NAMES = {
        # 2-1
        'A6CS03': 'Object Oriented Programming through Java',
        'A6CS01': 'Digital Electronics and Computer Organization',
        'A6CS05': 'Data Structures',
        'A6CS10': 'Software Engineering',
        'A6BS04': 'Computer Oriented Statistical Methods',
        # 2-2
        'A6BS05': 'Business Economics and Financial Analysis',
        'A6CS08': 'Discrete Mathematics',
        'A6CS13': 'Software Testing Fundamentals',
        'A6CS09': 'Database Management Systems',
        'A6CS11': 'Operating System',
        # Common abbreviations in hall tickets
        'A6BS05_SHORT': 'BEFA',
    }
    
    # Semester to academic year mapping (Check II Semester / 2-2 FIRST)
    SEMESTER_PATTERNS = [
        # Check 2-2 / II SEMESTER first
        (r'II\s*B\.?Tech\.?\s*-?\s*II\s+Semester', '2-2', 2, 4),
        (r'\bII\s+SEMESTER\b', '2-2', 2, 4),
        (r'2\s*-\s*2', '2-2', 2, 4),
        
        # Then check 2-1 / I SEMESTER
        (r'II\s*B\.?Tech\.?\s*-?\s*I\s+Semester', '2-1', 2, 3),
        (r'\bI\s+SEMESTER\b', '2-1', 2, 3),
        (r'2\s*-\s*1', '2-1', 2, 3),
    ]
    
    def __init__(self):
        pass
    
    def parse(self, text: str) -> dict:
        """
        Parse hall ticket text and extract profile data.
        
        Returns:
            {
                'branch': 'CSE',
                'regulation': 'R22',
                'year': 2,
                'semester': 1,
                'semester_display': 'II B.Tech I Semester',
                'subject_codes': ['A6CS05', 'A6CS08', ...],
                'subjects': [
                    {'code': 'A6CS05', 'name': 'Data Structures'},
                    ...
                ],
                'raw_text': text,
                'confidence': 'high' | 'medium' | 'low'
            }
        """
        log.info("Parsing hall ticket")
        
        result = {
            'branch': None,
            'regulation': None,
            'year': None,
            'semester': None,
            'semester_display': None,
            'subject_codes': [],
            'subjects': [],
            'raw_text': text,
            'confidence': 'low'
        }
        
        # Extract branch (CSE is default for now)
        if 'CSE' in text or 'Computer Science' in text:
            result['branch'] = 'CSE'
        
        # Extract regulation (R22, R18, R16, etc.) - from exam type or explicit mention
        # Look for pattern like "(R-22)" or "R22" but NOT from hall ticket number
        reg_match = re.search(r'\(R-?(\d{2})\)|\bR-?(\d{2})\b', text, re.IGNORECASE)
        if reg_match:
            reg_num = reg_match.group(1) or reg_match.group(2)
            # Verify it's not from hall ticket number (usually 2 digits + R + 2 digits + A)
            if not re.search(rf'\d{{2}}R{reg_num}A', text):
                result['regulation'] = f'R{reg_num}'
        
        # Extract semester and year
        for pattern, display, year, semester in self.SEMESTER_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                result['year'] = year
                result['semester'] = semester
                result['semester_display'] = display
                break
        
        # Extract subject codes
        subject_codes = re.findall(self.SUBJECT_CODE_PATTERN, text)
        result['subject_codes'] = list(set(subject_codes))  # deduplicate
        
        # Map codes to names
        for code in result['subject_codes']:
            name = self.SUBJECT_NAMES.get(code, 'Unknown Subject')
            result['subjects'].append({
                'code': code,
                'name': name
            })
        
        # Calculate confidence
        result['confidence'] = self._calculate_confidence(result)
        
        log.info(f"Parsed hall ticket: branch={result['branch']}, reg={result['regulation']}, "
                 f"semester={result['semester']}, subjects={len(result['subjects'])}, "
                 f"confidence={result['confidence']}")
        
        return result
    
    def _calculate_confidence(self, result: dict) -> str:
        """Calculate confidence score based on extracted data"""
        score = 0
        
        if result['branch']:
            score += 2
        if result['regulation']:
            score += 2
        if result['year'] and result['semester']:
            score += 3
        if len(result['subject_codes']) >= 3:
            score += 3
        
        if score >= 8:
            return 'high'
        elif score >= 5:
            return 'medium'
        else:
            return 'low'


def parse_hall_ticket(text: str) -> dict:
    """Convenience function for parsing hall ticket text"""
    parser = HallTicketParser()
    return parser.parse(text)
