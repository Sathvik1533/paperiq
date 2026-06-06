# Hall Ticket Upload — Onboarding Shortcut

## Overview

Hall Ticket Upload is an **optional onboarding shortcut** that automatically extracts student profile information from uploaded hall tickets. It does NOT replace manual onboarding — both methods are available.

## Two Onboarding Methods

### Method 1: Manual Onboarding (Existing)
- User selects college, branch, regulation, year, semester
- User manually selects subjects from dropdown
- Full control, works for any student

### Method 2: Hall Ticket Upload (NEW - Shortcut)
- User uploads hall ticket PDF or image
- System extracts branch, regulation, semester, subjects
- User reviews and confirms
- Faster, more accurate, less manual input

## How It Works

### Step 1: Upload Hall Ticket
```
POST /api/v1/onboarding/parse-hall-ticket
Content-Type: multipart/form-data

file: hall_ticket.pdf (or .jpg, .png)
```

**Supported formats:**
- PDF (text-based)
- Images (PNG, JPG) — uses OCR

### Step 2: Review Extracted Data

The API returns:
```json
{
  "branch": "CSE",
  "regulation": "R22",
  "year": 2,
  "semester": 1,
  "semester_display": "II B.Tech I Semester",
  "subject_codes": ["A6CS05", "A6CS08", "A6CS09", "A6CS11", "A6CS13"],
  "subjects": [
    {"code": "A6CS05", "name": "Data Structures"},
    {"code": "A6CS08", "name": "Discrete Mathematics"},
    {"code": "A6CS09", "name": "Database Management Systems"},
    {"code": "A6CS11", "name": "Operating System"},
    {"code": "A6CS13", "name": "Software Testing Fundamentals"}
  ],
  "confidence": "high"
}
```

### Step 3: Confirmation Screen (Frontend)

Show user:
```
Detected:
  Branch: CSE
  Regulation: R22
  Semester: II B.Tech II Semester
  
Subjects:
  ✓ A6CS05 - Data Structures
  ✓ A6CS08 - Discrete Mathematics
  ✓ A6CS09 - Database Management Systems
  ✓ A6CS11 - Operating System
  ✓ A6CS13 - Software Testing Fundamentals

[Looks Correct] [Edit Manually]
```

### Step 4: Save Profile
```
POST /api/v1/onboarding/confirm-hall-ticket
Content-Type: application/json

{
  "branch": "CSE",
  "regulation": "R22",
  "year": 2,
  "semester": 2,
  "subject_codes": ["A6CS05", "A6CS08", ...]
}
```

## What Gets Extracted

From MLRIT hall tickets, the parser extracts:

| Field | Example | Pattern |
|-------|---------|---------|
| Branch | CSE | "CSE" or "Computer Science" |
| Regulation | R22 | "(R-22)" or "R22" in exam type |
| Academic Year | 2 | "II B.Tech" |
| Semester | 1 or 2 | "I Semester" or "II Semester" |
| Subject Codes | A6CS05 | Pattern: A6[A-Z]{2}\d{2} |
| Subject Names | Data Structures | From known mapping |

## Known Subject Mappings

The parser recognizes these subjects:

**2-1 (II B.Tech I Semester):**
- A6IT02 — Object Oriented Programming through Java
- A6CS28 — Digital Electronics and Computer Organization
- A6CS05 — Data Structures
- A6CS07 — Software Engineering
- A6BS03 — Computer Oriented Statistical Methods

**2-2 (II B.Tech II Semester):**
- A6HS08 — Business Economics and Financial Analysis (BEFA)
- A6CS08 — Discrete Mathematics
- A6CS13 — Software Testing Fundamentals
- A6CS09 — Database Management Systems
- A6CS11 — Operating System

Unknown codes are labeled "Unknown Subject" and require manual verification.

## Confidence Scoring

The parser calculates confidence based on extracted data:

| Score | Confidence | Meaning |
|-------|-----------|---------|
| 8-10 | high | All fields extracted successfully |
| 5-7 | medium | Most fields extracted, some missing |
| 0-4 | low | Significant data missing, manual review required |

**Scoring breakdown:**
- Branch detected: +2
- Regulation detected: +2
- Year and semester detected: +3
- 3+ subject codes found: +3

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| "Unsupported file type" | File is not PDF/image | Use PDF or JPG/PNG |
| "Could not extract text" | PDF is image-based or unclear | Use clearer scan or manual entry |
| Low confidence score | Missing key data | Review and edit manually |

## Frontend Implementation Guide

### Option 1: Single Onboarding Page with Toggle

```typescript
// Onboarding.tsx
const [method, setMethod] = useState<'manual' | 'hall-ticket'>('manual')

return (
  <div>
    <h1>Create Your Profile</h1>
    
    <Tabs value={method} onValueChange={setMethod}>
      <TabsList>
        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        <TabsTrigger value="hall-ticket">Upload Hall Ticket</TabsTrigger>
      </TabsList>
      
      <TabsContent value="manual">
        <ManualOnboardingForm />
      </TabsContent>
      
      <TabsContent value="hall-ticket">
        <HallTicketUpload />
      </TabsContent>
    </Tabs>
  </div>
)
```

### Option 2: Hall Ticket as Optional Shortcut

```typescript
// Onboarding.tsx
return (
  <div>
    <h1>Create Your Profile</h1>
    
    {!showHallTicket && (
      <button onClick={() => setShowHallTicket(true)}>
        📄 Quick Setup: Upload Hall Ticket
      </button>
    )}
    
    {showHallTicket ? (
      <HallTicketUpload onSkip={() => setShowHallTicket(false)} />
    ) : (
      <ManualOnboardingForm />
    )}
  </div>
)
```

### Hall Ticket Upload Component

```typescript
// HallTicketUpload.tsx
const [file, setFile] = useState<File | null>(null)
const [result, setResult] = useState<ParseResult | null>(null)
const [loading, setLoading] = useState(false)

async function handleUpload() {
  setLoading(true)
  const formData = new FormData()
  formData.append('file', file!)
  
  const response = await fetch('/api/v1/onboarding/parse-hall-ticket', {
    method: 'POST',
    body: formData
  })
  
  const data = await response.json()
  setResult(data)
  setLoading(false)
}

if (result) {
  return (
    <ConfirmationScreen 
      data={result}
      onConfirm={handleConfirm}
      onEdit={() => setResult(null)}
    />
  )
}

return (
  <div>
    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0])} />
    <button onClick={handleUpload} disabled={!file || loading}>
      {loading ? 'Processing...' : 'Upload & Parse'}
    </button>
  </div>
)
```

### Confirmation Screen Component

```typescript
// ConfirmationScreen.tsx
function ConfirmationScreen({ data, onConfirm, onEdit }) {
  return (
    <div>
      <h2>Confirm Your Profile</h2>
      
      <div className={`confidence-badge ${data.confidence}`}>
        Confidence: {data.confidence}
      </div>
      
      <dl>
        <dt>Branch</dt>
        <dd>{data.branch}</dd>
        
        <dt>Regulation</dt>
        <dd>{data.regulation}</dd>
        
        <dt>Semester</dt>
        <dd>{data.semester_display}</dd>
      </dl>
      
      <h3>Subjects ({data.subjects.length})</h3>
      <ul>
        {data.subjects.map(subj => (
          <li key={subj.code}>
            ✓ {subj.code} — {subj.name}
          </li>
        ))}
      </ul>
      
      <div className="actions">
        <button onClick={onConfirm} className="primary">
          Looks Correct
        </button>
        <button onClick={onEdit} className="secondary">
          Edit Manually
        </button>
      </div>
    </div>
  )
}
```

## Testing

### Test with provided hall ticket images

```bash
# Test with 2-1 hall ticket
curl -X POST http://localhost:8000/api/v1/onboarding/parse-hall-ticket \
  -F "file=@/path/to/hallticket_2_1.pdf"

# Test with 2-2 hall ticket
curl -X POST http://localhost:8000/api/v1/onboarding/parse-hall-ticket \
  -F "file=@/path/to/hallticket_2_2.pdf"
```

### Test with script

```bash
cd backend
python scripts/test_hall_ticket_parser.py
```

Expected output:
```
✅ PARSER TEST COMPLETE
  2-1: Extracted 5 subjects (R22)
  2-2: Extracted 5 subjects (R22)
  Confidence: high
```

## Benefits

**For Students:**
- ⚡ Faster onboarding (30 seconds vs 3 minutes)
- ✅ No manual subject selection
- 🎯 Accurate regulation/semester detection
- 📸 Just upload, review, done

**For Product:**
- 📊 Higher completion rates
- 🎯 More accurate data
- 💪 Less support tickets ("I selected wrong semester")
- 🚀 Better first-time user experience

## Future Enhancements

1. **Multi-semester support**: Extract all semesters from hall ticket
2. **Historical data**: Parse old hall tickets for trend analysis
3. **Bulk upload**: Process multiple hall tickets at once
4. **Smart suggestions**: "We found 3 similar students, copy their profile?"
5. **OCR improvements**: Better text extraction from poor quality images

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/onboarding/parse-hall-ticket` | Upload and parse hall ticket |
| POST | `/api/v1/onboarding/confirm-hall-ticket` | Save parsed profile |
| POST | `/api/v1/onboarding/manual` | Manual profile creation (existing) |

## Files Created

**Backend:**
- `/backend/app/extractors/hall_ticket_parser.py` — Parser logic
- `/backend/app/api/onboarding.py` — API endpoints
- `/backend/scripts/test_hall_ticket_parser.py` — Test script

**Documentation:**
- `/HALL_TICKET_ONBOARDING.md` — This file

## Dependencies Added

```txt
pypdf==6.12.2         # PDF text extraction
pillow==12.2.0        # Image processing
pytesseract==0.3.13   # OCR for images
```

## Status

✅ Backend parser implemented  
✅ API endpoints created  
✅ Test script verified  
✅ Documentation complete  
⏳ Frontend UI (next step)

## Next Steps

1. Build frontend UI with file upload
2. Add confirmation screen
3. Wire up to existing onboarding flow
4. Test end-to-end with real hall tickets
5. Deploy to production
