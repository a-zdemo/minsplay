import os, json, urllib.request

SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDY4MjEsImV4cCI6MjEwNjM4MjgyMX0.26Lu_-rQX17LKXOSJ98d2OPRYIkfW_7S-8WaMsxqqeg"

print("=======================================================")
print("1. VERIFYING MODIFIED LOCAL FILES")
print("=======================================================")

files = ["public/js/comments-api.js", "public/js/comments.js", "public/js/player.js", "public/pages/watch.html"]
for f in files:
    if os.path.exists(f):
        print(f"  ✓ {f} exists ({os.path.getsize(f)} bytes)")
    else:
        print(f"  ✕ MISSING: {f}")

if os.path.exists("public/js/comments.js"):
    with open("public/js/comments.js", "r", encoding="utf-8") as fp:
        print("  ✓ comments.js is clean (zero mock seeds)" if "SEED_COMMENTS" not in fp.read() else "  ⚠️ Warning: SEED_COMMENTS found")

print("\n=======================================================")
print("2. TESTING LIVE SUPABASE COMMENTS REST API")
print("=======================================================")

headers = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}", "Content-Type": "application/json", "Prefer": "return=representation"}

try:
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/comments?select=*&limit=5", headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        print(f"  ✓ GET /rest/v1/comments: HTTP {resp.status} (Read OK)")
except Exception as e:
    print(f"  ✕ GET failed: {e}")

try:
    payload = json.dumps({"series_id": "the-beginning", "episode_id": 1, "username": "CLI Tester", "content": "Live test from Termux", "likes": 0}).encode("utf-8")
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/comments", data=payload, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=10) as resp:
        print(f"  ✓ POST /rest/v1/comments: HTTP {resp.status} (Write OK)")
except Exception as e:
    print(f"  ✕ POST failed: {e}")

print("=======================================================")
