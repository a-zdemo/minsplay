import os

manifest_path = "android/app/src/main/AndroidManifest.xml"
if not os.path.exists(manifest_path):
    print(f"Error: {manifest_path} not found.")
    exit(1)

with open(manifest_path, "r", encoding="utf-8") as f:
    content = f.read()

live_app_id = "ca-app-pub-6215013187981045~8480325432"
admob_meta = f"""        <!-- Google AdMob Application ID -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="{live_app_id}"/>"""

# If an AdMob APPLICATION_ID already exists, update its value
if "com.google.android.gms.ads.APPLICATION_ID" in content:
    import re
    content = re.sub(
        r'<meta-data\s+android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID"\s+android:value="[^"]*"\s*/>',
        f'<meta-data\n            android:name="com.google.android.gms.ads.APPLICATION_ID"\n            android:value="{live_app_id}"/>',
        content
    )
    print("✓ Updated existing AdMob Application ID to live ID")
else:
    if "</application>" in content:
        content = content.replace("</application>", f"{admob_meta}\n    </application>")
        print("✓ Successfully inserted live AdMob Application ID into AndroidManifest.xml")
    else:
        print("Error: Could not locate </application> in AndroidManifest.xml")
        exit(1)

with open(manifest_path, "w", encoding="utf-8") as f:
    f.write(content)

