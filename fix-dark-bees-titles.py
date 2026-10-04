import urllib.request
import json

SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDY4MjEsImV4cCI6MjEwNjM4MjgyMX0.26Lu_-rQX17LKXOSJ98d2OPRYIkfW_7S-8WaMsxqqeg"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/dramas?id=eq.the-dark-bees", headers=headers)
with urllib.request.urlopen(req) as res:
    rows = json.loads(res.read().decode())
    if rows:
        drama = rows[0]
        episodes = drama.get("episodes") or []
        for ep in episodes:
            ep["title"] = f"Episode {ep.get('id')}"
        drama["episodes"] = episodes

        save_req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/dramas",
            data=json.dumps(drama).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(save_req) as save_res:
            print(f"  ✓ Fixed 13 episode titles for 'The Dark Bees' (Episode 1 through 13) (HTTP {save_res.status})")
