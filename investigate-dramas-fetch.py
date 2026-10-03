import urllib.request
import json
import re
import os

SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDY4MjEsImV4cCI6MjEwNjM4MjgyMX0.26Lu_-rQX17LKXOSJ98d2OPRYIkfW_7S-8WaMsxqqeg"

headers = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"}

print("=== 1. CHECKING SUPABASE 'dramas' TABLE ===")
try:
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/dramas?select=*", headers=headers)
    with urllib.request.urlopen(req, timeout=8) as res:
        dramas = json.loads(res.read().decode())
        print(f"Total rows in 'public.dramas': {len(dramas)}")
        for d in dramas:
            print(f"  - [{d.get('id')}] {d.get('title')} ({len(d.get('episodes', []))} eps)")
except Exception as e:
    print(f"Error reading 'dramas': {e}")

print("\n=== 2. CHECKING SUPABASE 'r2_media_vault' TABLE ===")
try:
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/r2_media_vault?select=series_id,title,object_key", headers=headers)
    with urllib.request.urlopen(req, timeout=8) as res:
        vault = json.loads(res.read().decode())
        print(f"Total rows in 'r2_media_vault': {len(vault)}")
        unique_series = set(v.get("series_id") for v in vault if v.get("series_id"))
        print(f"Unique series in vault: {unique_series}")
except Exception as e:
    print(f"Error reading 'r2_media_vault': {e}")

print("\n=== 3. CHECKING HOMEPAGE CATALOG EVENT LISTENER IN ROUTER.JS ===")
if os.path.exists("public/js/router.js"):
    with open("public/js/router.js", "r", encoding="utf-8") as f:
        r_code = f.read()
    has_event = "catalogUpdated" in r_code
    print(f"router.js listens for 'catalogUpdated' event: {'✓ YES' if has_event else '✕ NO (Home renders before Supabase responds!)'}")
