import urllib.request, json

SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDY4MjEsImV4cCI6MjEwNjM4MjgyMX0.26Lu_-rQX17LKXOSJ98d2OPRYIkfW_7S-8WaMsxqqeg"

headers = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"}

for table in ["dramas", "series", "r2_media_vault"]:
    url = f"{SUPABASE_URL}/rest/v1/{table}?select=*&limit=5"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=8) as res:
            data = json.loads(res.read().decode())
            print(f"✓ Table '{table}' exists: {len(data)} sample records found")
            if data and table == "r2_media_vault":
                series_ids = set(d.get("series_id") for d in data if d.get("series_id"))
                print(f"  Sample series_ids: {series_ids}")
    except urllib.error.HTTPError as e:
        print(f"✕ Table '{table}' returned HTTP {e.code}")
    except Exception as e:
        print(f"✕ Table '{table}' error: {e}")
