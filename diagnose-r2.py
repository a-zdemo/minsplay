import os
import re
import urllib.request
import json

print("=== 1. SEARCHING REFS TO 'smart-responder' & 'r2_media_vault' IN FRONTEND ===")
for root, _, files in os.walk("public"):
    for f in files:
        if f.endswith((".js", ".html")):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8", errors="ignore") as fp:
                content = fp.read()
                if "smart-responder" in content or "r2_media_vault" in content or "action=sync" in content:
                    print(f"Found reference in: {path}")

print("\n=== 2. CHECKING SERIES-DATA.JS CATALOG LOGIC ===")
if os.path.exists("public/js/series-data.js"):
    with open("public/js/series-data.js", "r", encoding="utf-8") as f:
        lines = f.readlines()
    print(f"Total lines in series-data.js: {len(lines)}")
    print("".join(lines[100:165]))

print("\n=== 3. CHECKING CREATOR DASHBOARD SYNC / UPLOAD LOGIC ===")
if os.path.exists("public/js/creator.js"):
    with open("public/js/creator.js", "r", encoding="utf-8") as f:
        c_lines = f.readlines()
    print(f"Total lines in creator.js: {len(c_lines)}")
    for i, line in enumerate(c_lines):
        if any(w in line.lower() for w in ["sync", "smart-responder", "vault", "r2", "upload"]):
            print(f"Line {i+1}: {line.strip()[:90]}")

print("\n=== 4. CHECKING SUPABASE CREDENTIALS & R2_MEDIA_VAULT ROW COUNT ===")
sb_url, sb_key = None, None
for cand in ["public/js/tasks-api.js", "public/js/auth.js", "deploy-function.py", "run-sql.py"]:
    if os.path.exists(cand):
        with open(cand, "r", encoding="utf-8", errors="ignore") as f:
            txt = f.read()
            u_match = re.search(r'https://[a-z0-9]+\.supabase\.co', txt)
            k_match = re.search(r'eyJ[a-zA-Z0-9_\-\.]+', txt)
            if u_match and not sb_url:
                sb_url = u_match.group(0)
            if k_match and not sb_key:
                sb_key = k_match.group(0)

if sb_url and sb_key:
    print(f"Supabase URL: {sb_url}")
    try:
        req = urllib.request.Request(
            f"{sb_url}/rest/v1/r2_media_vault?select=id,object_key,title,series_id,created_at",
            headers={"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
        )
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"Rows found in 'r2_media_vault': {len(data)}")
            for item in data[:15]:
                print(f" - [{item.get('series_id')}] {item.get('object_key')}")
    except Exception as err:
        print(f"Error checking r2_media_vault table: {err}")
else:
    print("Could not locate Supabase URL/key automatically for direct test.")
