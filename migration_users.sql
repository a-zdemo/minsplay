
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
