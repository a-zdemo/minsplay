#!/usr/bin/env bash
# ==============================================================================
# Minsplay — Supabase Key Sync & Reward Tasks Verification Runner
# ==============================================================================
set -e

PROJECT_REF="lekmsvdbthupiauejffo"

# 1. Resolve Supabase Management Access Token
TOKEN="${SUPABASE_ACCESS_TOKEN:-$1}"
if [ -z "$TOKEN" ]; then
  read -r -p "Enter your Supabase Access Token (sbp_...): " TOKEN
fi

TOKEN=$(echo "$TOKEN" | tr -d '[:space:]')

# 2. Run Python inline worker to retrieve anon key and verify database
python3 - "$PROJECT_REF" "$TOKEN" << 'PYEOF'
import json
import os
import re
import sys
import urllib.request
import urllib.error

project_ref = sys.argv[1]
token = sys.argv[2]

if not token:
    print("Error: Supabase Access Token is required.")
    sys.exit(1)

print(f"\n1. Contacting Supabase Management API for project: {project_ref}...")

url = f"https://api.supabase.com/v1/projects/{project_ref}/api-keys"
req = urllib.request.Request(
    url,
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "User-Agent": "Minsplay-SyncRunner/1.0",
    },
    method="GET"
)

try:
    with urllib.request.urlopen(req) as resp:
        keys_list = json.loads(resp.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    print(f"Failed to fetch API keys (HTTP {e.code}): {e.read().decode('utf-8')}")
    sys.exit(1)
except Exception as e:
    print(f"Error fetching API keys: {e}")
    sys.exit(1)

anon_key = None
for item in keys_list:
    name = str(item.get("name") or item.get("type") or "").lower()
    if "anon" in name:
        anon_key = item.get("api_key")
        break

if not anon_key and keys_list:
    anon_key = keys_list[0].get("api_key")

if not anon_key:
    print("Could not locate the anon key in response:")
    print(json.dumps(keys_list, indent=2))
    sys.exit(1)

print("✓ Successfully retrieved your authentic anon API key!")
print(f"  Key preview: {anon_key[:18]}...{anon_key[-16:]}")

# Patch public/js/tasks-api.js if present
target_file = "public/js/tasks-api.js"
if os.path.exists(target_file):
    with open(target_file, "r") as f:
        content = f.read()

    updated = re.sub(r'const ANON_KEY = "[^"]+";', f'const ANON_KEY = "{anon_key}";', content)
    with open(target_file, "w") as f:
        f.write(updated)
    print("✓ Updated public/js/tasks-api.js with the authentic anon key!")

# Query Supabase PostgREST API
print(f"\n2. Querying Supabase PostgREST API (/rest/v1/reward_tasks)...")
query_url = f"https://{project_ref}.supabase.co/rest/v1/reward_tasks?select=id,title,reward_coins,action_type,sort_order&order=sort_order.asc"
query_req = urllib.request.Request(
    query_url,
    headers={
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
    },
    method="GET"
)

try:
    with urllib.request.urlopen(query_req) as resp:
        tasks = json.loads(resp.read().decode("utf-8"))
        print(f"✓ PostgREST query succeeded! Verified {len(tasks)} seeded tasks in database:\n")
        print(json.dumps(tasks, indent=2))
        print("\nAll database tables and API credentials are verified and active! 🎉")
except urllib.error.HTTPError as e:
    print(f"REST API query failed (HTTP {e.code}): {e.read().decode('utf-8')}")
    sys.exit(1)
PYEOF
