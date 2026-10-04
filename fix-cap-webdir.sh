#!/usr/bin/env bash
set -e

cat << 'EOF_CONFIG' > capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.minsplay.app',
  appName: 'Minsplay',
  webDir: 'public/dist'
};

export default config;
EOF_CONFIG

echo "✓ capacitor.config.ts updated with webDir: 'public/dist'"
npx cap sync android
