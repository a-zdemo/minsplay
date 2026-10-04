import urllib.request
import json

SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDY4MjEsImV4cCI6MjEwNjM4MjgyMX0.26Lu_-rQX17LKXOSJ98d2OPRYIkfW_7S-8WaMsxqqeg"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json"
}

print("=======================================================")
print("1. PURGING 'the-beginning' FROM r2_media_vault")
print("=======================================================")
try:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/r2_media_vault?series_id=eq.the-beginning",
        headers=headers,
        method="DELETE"
    )
    with urllib.request.urlopen(req, timeout=10) as res:
        print(f"  ✓ Purged from r2_media_vault (HTTP {res.status})")
except Exception as e:
    print(f"  ✕ Error deleting from r2_media_vault: {e}")

print("\n=======================================================")
print("2. PURGING 'the-beginning' FROM dramas")
print("=======================================================")
try:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/dramas?id=eq.the-beginning",
        headers=headers,
        method="DELETE"
    )
    with urllib.request.urlopen(req, timeout=10) as res:
        print(f"  ✓ Purged from dramas catalog (HTTP {res.status})")
except Exception as e:
    print(f"  ✕ Error deleting from dramas: {e}")

print("\n=======================================================")
print("3. VERIFYING REMAINING ASSETS IN VAULT")
print("=======================================================")
try:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/r2_media_vault?select=series_id,title,object_key",
        headers=headers
    )
    with urllib.request.urlopen(req, timeout=10) as res:
        remaining = json.loads(res.read().decode())
        print(f"  ✓ Total remaining rows in r2_media_vault: {len(remaining)}")
        for r in remaining:
            print(f"    - [{r.get('series_id')}] {r.get('title')}")
except Exception as e:
    print(f"  ✕ Error: {e}")

print("=======================================================")
