import urllib.request, json

SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDY4MjEsImV4cCI6MjEwNjM4MjgyMX0.26Lu_-rQX17LKXOSJ98d2OPRYIkfW_7S-8WaMsxqqeg"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

default_config = {
    "id": "global_config",
    "enabled": True,
    "test_mode": True,
    "app_id": "ca-app-pub-3940256099942544~3347511713",
    "rewarded_unlock_unit": "ca-app-pub-3940256099942544/5224354917",
    "rewarded_unlock_coins": 30,
    "rewarded_task_unit": "ca-app-pub-3940256099942544/5224354917",
    "rewarded_task_coins": 20,
    "rewarded_task_limit": 15,
    "interstitial_unit": "ca-app-pub-3940256099942544/1033173712",
    "interstitial_frequency": 3,
    "banner_unit": "ca-app-pub-3940256099942544/6300978111",
    "banner_home_enabled": True,
    "banner_rewards_enabled": True
}

try:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/admob_config",
        data=json.dumps(default_config).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    with urllib.request.urlopen(req) as res:
        print(f"  ✓ Initialized Supabase admob_config ledger (HTTP {res.status})")
except Exception as e:
    print(f"  ✕ Database notice: {e}")
