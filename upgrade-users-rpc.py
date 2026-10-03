import json, os, sys, urllib.request

PROJECT_REF = "lekmsvdbthupiauejffo"
SQL = """
CREATE OR REPLACE FUNCTION get_platform_users(
  search_query text DEFAULT '',
  page_num int DEFAULT 1,
  page_size int DEFAULT 20,
  admin_email text DEFAULT ''
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  caller_email text;
  total_count int;
  result json;
BEGIN
  caller_email := coalesce(nullif(auth.jwt() ->> 'email', ''), admin_email);
  IF caller_email NOT IN ('hi.azdemo@gmail.com', 'superadmin@minsplay.com', 'nob@123.com') 
     AND coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') != 'super_admin' THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admin can query platform users';
  END IF;

  SELECT count(*) INTO total_count FROM auth.users
  WHERE (search_query = '' OR email ILIKE '%' || search_query || '%' OR id::text ILIKE '%' || search_query || '%');

  SELECT json_build_object(
    'total', total_count, 'page', page_num, 'page_size', page_size,
    'users', coalesce(json_agg(u_data), '[]'::json)
  ) INTO result FROM (
    SELECT id, email, created_at,
      coalesce(raw_user_meta_data->>'role', 'user') as role,
      coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)) as username,
      coalesce(raw_user_meta_data->>'creatorStatus', 'none') as creator_status
    FROM auth.users
    WHERE (search_query = '' OR email ILIKE '%' || search_query || '%' OR id::text ILIKE '%' || search_query || '%')
    ORDER BY created_at DESC LIMIT page_size OFFSET (page_num - 1) * page_size
  ) u_data;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION set_user_platform_role(
  target_user_id text, new_role text, admin_email text DEFAULT ''
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE caller_email text;
BEGIN
  caller_email := coalesce(nullif(auth.jwt() ->> 'email', ''), admin_email);
  IF caller_email NOT IN ('hi.azdemo@gmail.com', 'superadmin@minsplay.com', 'nob@123.com') 
     AND coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') != 'super_admin' THEN
    RAISE EXCEPTION 'Access Denied: Only Super Admin can update roles';
  END IF;

  UPDATE auth.users
  SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', new_role),
      raw_app_meta_data  = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', new_role)
  WHERE id::text = target_user_id OR email = target_user_id;
  RETURN json_build_object('success', true, 'role', new_role);
END;
$$;
"""

token = os.environ.get("SUPABASE_ACCESS_TOKEN", "").strip() or input("Enter Supabase Access Token (sbp_...): ").strip()
req = urllib.request.Request(
    f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
    data=json.dumps({"query": SQL}).encode("utf-8"),
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
)
with urllib.request.urlopen(req) as resp:
    print("  ✓ Supabase get_platform_users & set_user_platform_role RPCs updated successfully!")
