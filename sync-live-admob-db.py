import urllib.request
import json

SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDY4MjEsImV4cCI6MjEwNjM4MjgyMX0.26Lu_-rQX17LKXOSJ98d2OPRYIkfW_7S-8WaMsxqqeg"

payload = {
    "id": "global_config",
    "enabled": True,
    "test_mode": True,  # Change to False when ready for live production ads
    "app_id": "ca-app-pub-6215013187981045~8480325432",
    "rewarded_unlock_unit": "ca-app-pub-6215013187981045/9023250919",
    "rewarded_unlock_coins": 30,
    "rewarded_task_unit": "ca-app-pub-6215013187981045/2241471717",
    "rewarded_task_coins": 20,
    "rewarded_task_limit": 15,
    "interstitial_unit": "ca-app-pub-6215013187981045/8592006078",
    "interstitial_frequency": 3,
    "banner_unit": ""
}

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

req = urllib.request.Request(
    f"{SUPABASE_URL}/rest/v1/admob_config",
    data=json.dumps(payload).encode("utf-8"),
    headers=headers,
    method="POST"
)

try:
    with urllib.request.urlopen(req) as res:
        print(f"✓ Live AdMob configuration written to cloud (HTTP {res.status})")
except Exception as e:
    print(f"✕ Update error: {e}")
