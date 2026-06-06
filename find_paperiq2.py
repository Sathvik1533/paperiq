import subprocess, json, urllib.request

TOKEN = subprocess.check_output(
    ["/opt/homebrew/share/google-cloud-sdk/bin/gcloud", "auth", "application-default", "print-access-token"],
    text=True
).strip()

def call_stitch(method, args):
    body = json.dumps({
        "jsonrpc": "2.0", "id": 1,
        "method": "tools/call",
        "params": {"name": method, "arguments": args}
    }).encode()
    req = urllib.request.Request(
        "https://stitch.googleapis.com/mcp", data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {TOKEN}",
            "X-Goog-User-Project": "gen-lang-client-0382027274"
        }
    )
    resp = urllib.request.urlopen(req, timeout=15)
    data = json.loads(resp.read())
    return json.loads(data["result"]["content"][0]["text"])

# Check all 14 projects' screens
project_ids = [
    ("projects/17298951222621199248", "Fashion Storefront"),
    ("projects/14761276546960605598", "Dental Booking"),
    ("projects/1110395244320177439", "Generated Screen"),
    ("projects/11189091354187603534", "Landing Page"),
    ("projects/2002075195084409264", "FinSight Landing"),
    ("projects/6447357030649611652", "FinSight Landing 2"),
    ("projects/7942967344529245972", "FinSight Dashboard"),
    ("projects/5802616661922052683", "Portfolio Website"),
    ("projects/11956308667729607724", "Portfolio Landing"),
    ("projects/15383047277224805315", "Header/Nav"),
    ("projects/18346792693042631133", "CivicAlert"),
    ("projects/16706181252346797843", "Civic Map"),
    ("projects/5784086717668489228", "E-commerce"),
    ("projects/7571702827408997167", "Untitled"),
]

PAPERIQ_KEYWORDS = ["paper", "iq", "onboarding", "hall ticket", "analysis", "subject", "syllabus", "exam", "jntuh", "mlrit", "semester"]

for pid, label in project_ids:
    try:
        result = call_stitch("list_screens", {"project_id": pid})
        screens = result.get("screens", [])
        all_text = " ".join([s.get("title","").lower() for s in screens])
        match = any(kw in all_text for kw in PAPERIQ_KEYWORDS)
        if match or len(screens) > 5:
            print(f"\n{'*** MATCH ***' if match else 'Large project'}: {pid} ({label}, {len(screens)} screens)")
            for s in screens:
                print(f"  {s['name'].split('/')[-1][:32]} | {s.get('title','---')[:60]}")
    except Exception as e:
        print(f"Error {label}: {e}")

print("\nDone.")
