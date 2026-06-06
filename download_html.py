import json, urllib.request, os, glob

out_dir = "/Users/k.sathvik/paperiq/stitch_screens"
html_dir = "/Users/k.sathvik/paperiq/stitch_html"
os.makedirs(html_dir, exist_ok=True)

for meta_file in sorted(glob.glob(f"{out_dir}/*.html")):
    name = os.path.basename(meta_file).replace(".html", "")
    with open(meta_file) as f:
        content = f.read().strip()
    
    # Parse the JSON metadata
    try:
        data = json.loads(content)
    except Exception:
        print(f"Skip {name} — not JSON")
        continue
    
    html_url = data.get("htmlCode", {}).get("downloadUrl")
    title = data.get("title", name)
    
    if not html_url:
        print(f"Skip {name} — no htmlCode URL")
        continue
    
    try:
        req = urllib.request.Request(html_url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=30)
        html = resp.read().decode("utf-8")
        out_path = f"{html_dir}/{name}.html"
        with open(out_path, "w") as f:
            f.write(html)
        print(f"OK {name} — {len(html):,} chars — {title[:50]}")
    except Exception as e:
        print(f"ERROR {name}: {e}")

print("\nAll HTML files saved to:", html_dir)
