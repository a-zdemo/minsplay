#!/usr/bin/env bash
set -e

echo "======================================================="
echo "1. CREATING GITHUB ACTIONS WORKFLOW FOR APK COMPILATION"
echo "======================================================="

mkdir -p .github/workflows

cat << 'EOF_YML' > .github/workflows/build-apk.yml
name: Build Android APK

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build:
    name: Build Native Android APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Setup Java JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Install NPM Dependencies
        run: npm ci || npm install

      - name: Build Web Production Assets
        run: npm run build

      - name: Sync Capacitor to Android
        run: npx cap sync android

      - name: Make Gradle Wrapper Executable
        run: chmod +x android/gradlew

      - name: Assemble Debug APK
        run: |
          cd android
          ./gradlew assembleDebug --stacktrace

      - name: Upload Debug APK
        uses: actions/upload-artifact@v4
        with:
          name: minsplay-app-debug
          path: android/app/build/outputs/apk/debug/app-debug.apk
          retention-days: 14
EOF_YML

echo "✓ Created .github/workflows/build-apk.yml"

echo ""
echo "======================================================="
echo "2. VERIFYING AndroidManifest.xml PERMISSIONS & ADMOB ID"
echo "======================================================="

python3 - << 'EOF_PY'
import os
import re

manifest_path = "android/app/src/main/AndroidManifest.xml"
if not os.path.exists(manifest_path):
    print(f"Error: {manifest_path} not found.")
    exit(1)

with open(manifest_path, "r", encoding="utf-8") as f:
    content = f.read()

live_app_id = "ca-app-pub-6215013187981045~8480325432"

permissions = """    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />"""

if "android.permission.INTERNET" not in content:
    content = content.replace("<application", f"{permissions}\n    <application")
    print("  ✓ Added INTERNET and NETWORK_STATE permissions")

meta_tag = f"""        <!-- Google Mobile Ads Application ID -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="{live_app_id}"/>"""

if "com.google.android.gms.ads.APPLICATION_ID" in content:
    content = re.sub(
        r'<meta-data\s+android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID"\s+android:value="[^"]*"\s*/>',
        f'<meta-data\n            android:name="com.google.android.gms.ads.APPLICATION_ID"\n            android:value="{live_app_id}"/>',
        content
    )
    print(f"  ✓ Verified live AdMob Application ID: {live_app_id}")
else:
    content = content.replace("</application>", f"{meta_tag}\n    </application>")
    print(f"  ✓ Inserted live AdMob Application ID: {live_app_id}")

with open(manifest_path, "w", encoding="utf-8") as f:
    f.write(content)

EOF_PY

echo ""
echo "======================================================="
echo "3. BUILDING WEB ASSETS & SYNCING CAPACITOR"
echo "======================================================="
npm run build
npx cap sync android

echo ""
echo "======================================================="
echo "4. COMMITTING & PUSHING TO TRIGGER APK COMPILATION"
echo "======================================================="
git add .
git commit -m "Configure GitHub Actions APK build workflow and verify AdMob manifest" || true
git push origin main

echo ""
echo "======================================================="
echo "✓ SUCCESS: GitHub Actions build triggered!"
echo "======================================================="
