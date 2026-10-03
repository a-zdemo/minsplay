import urllib.request, json

SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDY4MjEsImV4cCI6MjEwNjM4MjgyMX0.26Lu_-rQX17LKXOSJ98d2OPRYIkfW_7S-8WaMsxqqeg"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

print("=== TESTING SUPABASE user_profiles LIVE API ===")

test_profile = {
    "id": "test_user_wallet_99",
    "email": "test@minsplay.com",
    "username": "Test Explorer",
    "coins": 85,
    "vip_active": True,
    "streak_data": {"streak": 3, "claimed_today": True},
    "unlocked_episodes": ["the-beginning_1", "the-beginning_2"]
}

try:
    payload = json.dumps(test_profile).encode("utf-8")
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/user_profiles", data=payload, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=10) as resp:
        print(f"  ✓ Upsert to user_profiles: Success (HTTP {resp.status})")

    get_req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/user_profiles?id=eq.test_user_wallet_99", headers=headers)
    with urllib.request.urlopen(get_req, timeout=10) as resp:
        rows = json.loads(resp.read().decode())
        print(f"  ✓ Read from user_profiles: Returned {len(rows)} row(s)")
        if rows:
            print(f"    Coins: {rows[0].get('coins')} | VIP: {rows[0].get('vip_active')} | Unlocked: {len(rows[0].get('unlocked_episodes', []))} episodes")
except Exception as e:
    print(f"  ✕ Error: {e}")
