import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_URL = "https://lekmsvdbthupiauejffo.supabase.co/functions/v1/smart-responder"

print("=" * 60)
print("1. TESTING GET /smart-responder (Existing Vault Records)")
print("=" * 60)
try:
    req = urllib.request.Request(f"{BASE_URL}?limit=50", headers={"User-Agent": "Minsplay-Diagnostics/1.0"})
    with urllib.request.urlopen(req, context=ctx, timeout=15) as res:
        data = json.loads(res.read().decode())
        print(f"Success: {data.get('success')}")
        print(f"Total in Database: {data.get('total')}")
        print(f"Items returned: {len(data.get('items', []))}")
        for idx, item in enumerate(data.get('items', []), 1):
            print(f" {idx}. [{item.get('series_id')}] {item.get('title')} -> {item.get('filename')}")
except Exception as e:
    print(f"GET error: {e}")

print("\n" + "=" * 60)
print("2. TESTING GET /smart-responder?action=sync (Trigger Cloudflare Sync)")
print("=" * 60)
try:
    req = urllib.request.Request(f"{BASE_URL}?action=sync", headers={"User-Agent": "Minsplay-Diagnostics/1.0"})
    with urllib.request.urlopen(req, context=ctx, timeout=25) as res:
        sync_data = json.loads(res.read().decode())
        print(f"Sync Result: {sync_data}")
except Exception as e:
    print(f"Sync error: {e}")

print("\n" + "=" * 60)
print("3. EXAMINING CREATOR.JS (Lines 1 to 70)")
print("=" * 60)
try:
    with open("public/js/creator.js", "r", encoding="utf-8") as f:
        lines = f.readlines()
    print("".join(lines[:70]))
except Exception as e:
    print(f"Error reading creator.js: {e}")
