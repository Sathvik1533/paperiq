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

# Get full project details for every project
result = call_stitch("list_projects", {})
projects = result.get("projects", [])
print(f"Total projects: {len(projects)}\n")
for p in projects:
    pid = p["name"]
    title = p.get("title", "---")
    try:
        proj = call_stitch("get_project", {"project_id": pid})
        screens = proj.get("screens", [])
        screen_titles = [s.get("title", "---") for s in screens[:3]]
        print(f"{pid}")
        print(f"  Title: {title}")
        print(f"  Screens: {len(screens)} — {screen_titles}")
        # Check if any screen title contains PaperIQ keywords
        all_titles = " ".join([s.get("title","") for s in screens]).lower()
        if any(kw in all_titles for kw in ["paperiq", "paper iq", "onboarding", "hall ticket", "analysis", "subject"]):
            print(f"  *** POSSIBLE PAPERIQ PROJECT ***")
        print()
    except Exception as e:
        print(f"{pid} | {title} | Error: {e}\n")
