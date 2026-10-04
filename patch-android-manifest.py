import os

manifest_path = "android/app/src/main/AndroidManifest.xml"
if not os.path.exists(manifest_path):
    print(f"Error: {manifest_path} not found.")
    exit(1)

with open(manifest_path, "r", encoding="utf-8") as f:
    content = f.read()

admob_meta = """        <!-- Google AdMob Application ID -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="ca-app-pub-3940256099942544~3347511713"/>"""

if "com.google.android.gms.ads.APPLICATION_ID" in content:
    print("✓ AdMob Application ID is already present in AndroidManifest.xml")
else:
    if "</application>" in content:
        content = content.replace("</application>", f"{admob_meta}\n    </application>")
        with open(manifest_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("✓ Successfully added Google AdMob Application ID to AndroidManifest.xml")
    else:
        print("Error: Could not locate </application> in AndroidManifest.xml")
