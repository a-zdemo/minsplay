import os, re, json, urllib.request

SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDY4MjEsImV4cCI6MjEwNjM4MjgyMX0.26Lu_-rQX17LKXOSJ98d2OPRYIkfW_7S-8WaMsxqqeg"

print("==================================================================")
print("1. SCANNING FRONTEND JS FOR HARDCODED CONSTANTS & LOCALSTORAGE")
print("==================================================================")

hardcoded_targets = {
    "DRAMA_CATALOG": "public/js/series-data.js",
    "CREATOR_APPS": "public/js/auth.js",
    "COMMENTS_MOCK": "public/js/player.js",
    "CHECKIN_REWARDS": "public/js/storage.js",
    "VIP_PLANS": "public/js/member.js",
}

for label, filepath in hardcoded_targets.items():
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        local_keys = re.findall(r'localStorage\.(?:getItem|setItem)\(["\']([^"\']+)["\']', content)
        const_matches = re.findall(r'(?:const|let|var)\s+([A-Z0-9_]{4,})\s*=', content)
        print(f"[{label}] in {filepath}:")
        print(f"  - LocalStorage keys: {list(set(local_keys))[:6]}")
        print(f"  - Major Constants:   {list(set(const_matches))[:6]}")
    else:
        print(f"[{label}] {filepath} (Not Found)")

print("\n==================================================================")
print("2. CHECKING EXISTING TABLES IN SUPABASE REST API")
print("==================================================================")

tables_to_test = [
    "r2_media_vault",
    "reward_tasks",
    "user_task_progress",
    "creator_applications",
    "comments",
    "dramas",
    "user_profiles"
]

for tbl in tables_to_test:
    url = f"{SUPABASE_URL}/rest/v1/{tbl}?select=*&limit=1"
    req = urllib.request.Request(
        url,
        headers={"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"}
    )
    try:
        with urllib.request.urlopen(req, timeout=6) as res:
            data = json.loads(res.read().decode())
            print(f"  ✓ '{tbl}' exists in Supabase (HTTP 200, {len(data)} row returned)")
    except urllib.error.HTTPError as e:
        status = "Table Missing (404)" if e.code == 404 else f"HTTP {e.code}"
        print(f"  ✕ '{tbl}': {status}")
    except Exception as e:
        print(f"  ✕ '{tbl}': error ({e})")
