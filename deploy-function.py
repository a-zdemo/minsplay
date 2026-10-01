import json
import os
import sys
import urllib.request
import urllib.error

PROJECT_REF = "lekmsvdbthupiauejffo"
FUNCTION_SLUG = "smart-responder"
FILE_PATH = "supabase/functions/smart-responder/index.ts"

if not os.path.exists(FILE_PATH):
    # Fallback path if inside a different folder
    FILE_PATH = "supabase/functions/get-upload-url/index.ts"

# 1. Read access token from argument, env variable, or prompt
token = os.environ.get("SUPABASE_ACCESS_TOKEN", "").strip()
if not token and len(sys.argv) > 1:
    token = sys.argv[1].strip()

if not token:
    token = input("Enter your Supabase Access Token (sbp_...): ").strip()

if not token.startswith("sbp_"):
    print("Error: Supabase access tokens typically start with 'sbp_'")
    sys.exit(1)

# 2. Read the local edge function source code
with open(FILE_PATH, "r") as f:
    code = f.read()

print(f"Deploying {FUNCTION_SLUG} ({len(code)} bytes) to Supabase project {PROJECT_REF}...")

# 3. Send update via Supabase Management API
url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/functions/{FUNCTION_SLUG}"
payload = json.dumps({"body": code, "verify_jwt": False}).encode("utf-8")

req = urllib.request.Request(
    url,
    data=payload,
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "User-Agent": "Minsplay-Termux-Deployer/1.0",
    },
    method="PATCH"
)

try:
    with urllib.request.urlopen(req) as resp:
        res_data = json.loads(resp.read().decode("utf-8"))
        print("\nSuccess! Edge function deployed successfully! ⚡")
        print(f"Status: {res_data.get('status', 'ACTIVE')}")
        print(f"Version: {res_data.get('version', 'latest')}")
        print(f"Updated at: {res_data.get('updated_at', '')}")
except urllib.error.HTTPError as e:
    err_body = e.read().decode("utf-8")
    print(f"\nDeployment error (HTTP {e.code}): {err_body}")
except Exception as e:
    print(f"\nNetwork error: {e}")
