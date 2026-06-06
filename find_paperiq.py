import subprocess, json, urllib.request

TOKEN = subprocess.check_output(
    ["/opt/homebrew/share/google-cloud-sdk/bin/gcloud", "auth", "application-default", "print-access-token"],
    text=True
).strip()

project_ids = [
    "projects/17298951222621199248",
    "projects/14761276546960605598",
    "projects/1110395244320177439",
    "projects/11189091354187603534",
    "projects/2002075195084409264",
    "projects/6447357030649611652",
    "projects/7942967344529245972",
    "projects/5802616661922052683",
    "projects/11956308667729607724",
    "projects/15383047277224805315",
    "projects/18346792693042631133",
    "projects/16706181252346797843",
    "projects/5784086717668489228",
    "projects/7571702827408997167",
]

for pid in project_ids:
    body = json.dumps({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "list_screens",
            "arguments": {"project_id": pid}
        }
    }).encode()
    req = urllib.request.Request(
        "https://stitch.googleapis.com/mcp",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {TOKEN}",
            "X-Goog-User-Project": "gen-lang-client-0382027274"
        }
    )
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        text = data["result"]["content"][0]["text"]
        obj = json.loads(text)
        screens = obj.get("screens", [])
        if len(screens) >= 3:
            print(f"\n=== {pid} ({len(screens)} screens) ===")
            for s in screens:
                print(f"  {s['name']} | {s.get('title','---')}")
    except Exception as e:
        print(f"Error {pid}: {e}")
