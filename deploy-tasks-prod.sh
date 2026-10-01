#!/usr/bin/env bash
set -e

echo "1. Building production bundle with Vite..."
npm run build

if [ -f "$HOME/sync-to-acode" ]; then
  echo "2. Syncing to Acode..."
  ~/sync-to-acode
fi

echo "3. Committing and pushing to Render..."
git add .
git commit -m "Deploy authentic Supabase anon key and persistent reward tasks integration"
git push origin main

echo ""
echo "✓ Successfully pushed to GitHub! Render deployment initiated 🚀"
