import json, os, sys, urllib.request, urllib.error

PROJECT_REF = "lekmsvdbthupiauejffo"

SQL_SETUP = """
CREATE OR REPLACE FUNCTION get_platform_users(
  search_query text DEFAULT '',
  page_num int DEFAULT 1,
  page_size int DEFAULT 20
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_email text;
  total_count int;
  result json;
BEGIN
  caller_email := auth.jwt() ->> 'email';
  IF caller_email NOT IN ('hi.azdemo@gmail.com', 'superadmin@minsplay.com', 'nob@123.com') 
     AND coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') != 'super_admin' THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admin can query platform users';
  END IF;

  SELECT count(*) INTO total_count
  FROM auth.users
  WHERE (search_query = '' OR email ILIKE '%' || search_query || '%' OR id::text ILIKE '%' || search_query || '%');

  SELECT json_build_object(
    'total', total_count,
    'page', page_num,
    'page_size', page_size,
    'users', coalesce(json_agg(u_data), '[]'::json)
  ) INTO result
  FROM (
    SELECT 
      id,
      email,
      created_at,
      coalesce(raw_user_meta_data->>'role', 'user') as role,
      coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)) as username,
      coalesce(raw_user_meta_data->>'creatorStatus', 'none') as creator_status
    FROM auth.users
    WHERE (search_query = '' OR email ILIKE '%' || search_query || '%' OR id::text ILIKE '%' || search_query || '%')
    ORDER BY created_at DESC
    LIMIT page_size
    OFFSET (page_num - 1) * page_size
  ) u_data;

  RETURN result;
END;
$$;

SELECT 
  (SELECT count(*) FROM auth.users) as total_users,
  coalesce(json_agg(json_build_object(
    'id', id,
    'email', email,
    'role', coalesce(raw_user_meta_data->>'role', 'user'),
    'created_at', created_at
  )), '[]'::json) as recent_users
FROM (
  SELECT id, email, raw_user_meta_data, created_at 
  FROM auth.users 
  ORDER BY created_at DESC 
  LIMIT 25
) sub;
"""

def resolve_token():
    token = os.environ.get("SUPABASE_ACCESS_TOKEN", "").strip()
    if not token and len(sys.argv) > 1:
        token = sys.argv[1].strip()
    if not token:
        token = input("Enter your Supabase Access Token (sbp_...): ").strip()
    return token

def run():
    token = resolve_token()
    if not token:
        print("Error: Access token cannot be empty.")
        sys.exit(1)

    print(f"\n[+] Executing SQL migration & querying Supabase users for {PROJECT_REF}...")
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
    payload = json.dumps({"query": SQL_SETUP}).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "Minsplay-Termux-SQL/1.0",
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data and len(data) > 0:
                row = data[0]
                total = row.get("total_users", 0)
                users = row.get("recent_users", [])
                print("\n=======================================================")
                print(f" LIVE SUPABASE REGISTERED USERS COUNT: {total}")
                print("=======================================================")
                for idx, u in enumerate(users, 1):
                    role = (u.get("role") or "user").upper()
                    email = u.get("email") or "No Email"
                    created = (u.get("created_at") or "")[:10]
                    uid = (u.get("id") or "")[:8]
                    print(f" {idx}. [{role}] {email} (ID: {uid}...) | Joined: {created}")
                print("\n  ✓ Function 'get_platform_users' installed successfully in Postgres!")
            else:
                print("  ✓ SQL query executed successfully.")
    except urllib.error.HTTPError as e:
        print(f"\n[!] HTTP Error {e.code}: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"\n[!] Error: {e}")

if __name__ == "__main__":
    run()
