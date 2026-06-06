import subprocess, json, urllib.request, os

TOKEN = subprocess.check_output(
    ["/opt/homebrew/share/google-cloud-sdk/bin/gcloud", "auth", "application-default", "print-access-token"],
    text=True
).strip()

PROJECT_ID = "projects/7203518523285016713"

SCREENS = [
    ("ff9bc549d0dd4fda940bc9e83bd9015d", "01_landing"),
    ("0c9c13db764f4522919f93f0a94d3027", "02_login"),
    ("d6a88c63fbe9479c96668cdba275ba80", "03_signup"),
    ("2572fb9b71464242922b23aa1ee81337", "04_forgot_password"),
    ("dfeb1b86b6a74722a0f86e38f0a985da", "05_onboarding_select"),
    ("37b8702258c3440da293ec60a09f3589", "07_onboarding_extracting"),
    ("91ba570fcec14fd18af444d6ddbe8bcd", "08_onboarding_confirm"),
    ("333915d0b3124a5b9fe4271feda17805", "09_onboarding_manual"),
    ("bad197c8f9064a4a9129131eb0e9d4b7", "10_dashboard"),
    ("3a2cf6ca7bbd4aa09000584f574b7d8c", "11_analysis_select"),
    ("dfd2f5e14ebe470d96bb0855f6a37d62", "12_analysis_results"),
    ("60f4ee0478c44af1aa9ee8bad4d520aa", "13_study_priority"),
    ("3943fac9c75a4faa8fd7761837e62184", "14_unit_intelligence"),
    ("e1eaf2121ad14c55a2679749a3d338a8", "15_papers_browser"),
    ("2a93b84daad648769a975850eba43bc6", "16_papers_empty"),
    ("a7bb3a81b10941bd939d2c73d3c76009", "17_paper_view"),
    ("a2e896b541414a18affce529a66005d8", "18_pdf_viewer"),
    ("8e72c8e7ad2d403ea00aa6b4e98c2baa", "19_profile"),
    ("2bdb492313a4462c8e8b99e06bcdd3d2", "20_settings"),
    ("16b0dac04a8b4fde96c088a4c83e1c8e", "21_404"),
    ("41703c1f1dfe41fe928e1baf42a24769", "22_error"),
    ("71106cdb3e1a46a6b3fcf319c4368967", "23_offline"),
]

out_dir = "/Users/k.sathvik/paperiq/stitch_screens"
os.makedirs(out_dir, exist_ok=True)

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
    resp = urllib.request.urlopen(req, timeout=30)
    return json.loads(resp.read())

for screen_id, name in SCREENS:
    full_id = f"{PROJECT_ID}/screens/{screen_id}"
    print(f"Fetching {name}...")
    try:
        result = call_stitch("get_screen", {"screen_id": full_id, "format": "html"})
        content = result["result"]["content"]
        html = ""
        for item in content:
            if item.get("type") == "text":
                html += item["text"]
        out_path = f"{out_dir}/{name}.html"
        with open(out_path, "w") as f:
            f.write(html)
        size = len(html)
        print(f"  Saved {name}.html ({size} chars)")
    except Exception as e:
        print(f"  ERROR {name}: {e}")

print("\nAll done!")
