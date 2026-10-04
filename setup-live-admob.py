import urllib.request
import json
import os
import re

SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDY4MjEsImV4cCI6MjEwNjM4MjgyMX0.26Lu_-rQX17LKXOSJ98d2OPRYIkfW_7S-8WaMsxqqeg"

live_app_id = "ca-app-pub-6215013187981045~8480325432"
live_unlock_id = "ca-app-pub-6215013187981045/9023250919"
live_task_id = "ca-app-pub-6215013187981045/2241471717"
live_interstitial_id = "ca-app-pub-6215013187981045/8592006078"

print("=======================================================")
print("1. SAVING LIVE ADMOB CONFIGURATION TO SUPABASE")
print("=======================================================")

payload = {
    "id": "global_config",
    "enabled": True,
    "test_mode": False,
    "app_id": live_app_id,
    "rewarded_unlock_unit": live_unlock_id,
    "rewarded_unlock_coins": 30,
    "rewarded_task_unit": live_task_id,
    "rewarded_task_coins": 20,
    "rewarded_task_limit": 15,
    "interstitial_unit": live_interstitial_id,
    "interstitial_frequency": 3,
    "banner_unit": ""
}

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

try:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/admob_config",
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    with urllib.request.urlopen(req) as res:
        print(f"  ✓ Live AdMob configuration saved to Supabase (HTTP {res.status})")
except Exception as e:
    print(f"  ✕ Supabase update notice: {e}")

print("\n=======================================================")
print("2. PATCHING AndroidManifest.xml WITH LIVE APP ID")
print("=======================================================")

manifest_path = "android/app/src/main/AndroidManifest.xml"
if os.path.exists(manifest_path):
    with open(manifest_path, "r", encoding="utf-8") as f:
        content = f.read()

    admob_meta = f"""        <!-- Google AdMob Application ID -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="{live_app_id}"/>"""

    if "com.google.android.gms.ads.APPLICATION_ID" in content:
        content = re.sub(
            r'<meta-data\s+android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID"\s+android:value="[^"]*"\s*/>',
            f'<meta-data\n            android:name="com.google.android.gms.ads.APPLICATION_ID"\n            android:value="{live_app_id}"/>',
            content
        )
        print("  ✓ Updated existing Application ID to your live ID in AndroidManifest.xml")
    else:
        if "</application>" in content:
            content = content.replace("</application>", f"{admob_meta}\n    </application>")
            print("  ✓ Inserted live Application ID into AndroidManifest.xml")
        else:
            print("  ✕ Could not locate </application> in AndroidManifest.xml")

    with open(manifest_path, "w", encoding="utf-8") as f:
        f.write(content)
else:
    print(f"  ✕ Notice: {manifest_path} not found.")

print("\n=======================================================")
print("LIVE SETUP SCRIPT COMPLETE")
print("=======================================================")
