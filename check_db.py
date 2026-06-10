from supabase import create_client
import os
import json

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")

if not supabase_url or not supabase_key:
    # Try to read from .env
    from dotenv import load_dotenv
    load_dotenv('backend/.env')
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")

supabase = create_client(supabase_url, supabase_key)

papers = supabase.table("papers").select("id, exam_year, regulation").execute().data
questions = supabase.table("questions").select("paper_id, marks").execute().data

# group questions by paper
p_marks = {}
for q in questions:
    pid = q['paper_id']
    if pid not in p_marks: p_marks[pid] = 0
    p_marks[pid] += (q.get('marks') or 0)

stats = {}
for p in papers:
    pid = p['id']
    yr = p.get('exam_year')
    reg = p.get('regulation')
    m = p_marks.get(pid, 0)
    
    key = f"{yr}-{reg}"
    if key not in stats: stats[key] = []
    stats[key].append(m)

for k, v in sorted(stats.items()):
    print(f"Year-Reg: {k} -> Count: {len(v)}, Avg Marks: {sum(v)/len(v) if v else 0:.1f}, Unique Marks: {set(v)}")
