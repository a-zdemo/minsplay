#!/usr/bin/env bash
set -e

echo "======================================================="
echo "STEP 1: Checking Capacitor Configuration"
echo "======================================================="
if [ ! -f "capacitor.config.json" ] && [ ! -f "capacitor.config.ts" ]; then
  echo "Initializing Capacitor configuration..."
  npx cap init "Minsplay" "com.minsplay.app" --web-dir "dist"
else
  echo "✓ Capacitor configuration detected."
fi

echo ""
echo "======================================================="
echo "STEP 2: Building Production Web Assets (dist)"
echo "======================================================="
npm run build

echo ""
echo "======================================================="
echo "STEP 3: Setting Up Android Native Platform"
echo "======================================================="
if [ ! -d "android" ]; then
  echo "Adding native Android platform directory..."
  npx cap add android
else
  echo "✓ Native Android platform folder already exists."
fi

echo "Syncing plugins, AdMob bridge, and web assets to Android..."
npx cap sync android

echo ""
echo "======================================================="
echo "✓ SUCCESS: Native Android sync completed successfully!"
echo "======================================================="
