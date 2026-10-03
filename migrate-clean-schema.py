import json, os, sys, urllib.request, urllib.error

PROJECT_REF = "lekmsvdbthupiauejffo"

SQL_CLEAN_MIGRATION = """
CREATE TABLE IF NOT EXISTS public.dramas (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  genre TEXT NOT NULL DEFAULT 'Urban Drama',
  synopsis TEXT DEFAULT '',
  badge TEXT DEFAULT 'NEW',
  badge_class TEXT DEFAULT 'badge-new',
  poster_url TEXT DEFAULT '',
  plays TEXT DEFAULT '0',
  status TEXT DEFAULT 'published',
  creator_id TEXT DEFAULT '',
  episodes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.creator_applications (
  id TEXT PRIMARY KEY DEFAULT ('app_' || floor(extract(epoch from now()) * 1000)::text),
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  studio_name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.comments (
  id TEXT PRIMARY KEY DEFAULT ('cmt_' || floor(extract(epoch from now()) * 1000)::text),
  series_id TEXT NOT NULL,
  episode_id INT DEFAULT 1,
  user_id TEXT,
  username TEXT NOT NULL DEFAULT 'Drama Fan',
  avatar TEXT DEFAULT '/icons/icon-192.png',
  content TEXT NOT NULL,
  likes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  username TEXT DEFAULT 'User',
  coins INT DEFAULT 20,
  vip_active BOOLEAN DEFAULT FALSE,
  vip_expiry TIMESTAMPTZ,
  streak_data JSONB DEFAULT '{"streak": 0, "claimed_today": false, "last_checkin": null}'::jsonb,
  unlocked_episodes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dramas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read dramas" ON public.dramas;
CREATE POLICY "Public read dramas" ON public.dramas FOR SELECT USING (true);
DROP POLICY IF EXISTS "Full manage dramas" ON public.dramas;
CREATE POLICY "Full manage dramas" ON public.dramas FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read creator apps" ON public.creator_applications;
CREATE POLICY "Public read creator apps" ON public.creator_applications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert creator apps" ON public.creator_applications;
CREATE POLICY "Public insert creator apps" ON public.creator_applications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Full manage creator apps" ON public.creator_applications;
CREATE POLICY "Full manage creator apps" ON public.creator_applications FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read comments" ON public.comments;
CREATE POLICY "Public read comments" ON public.comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert comments" ON public.comments;
CREATE POLICY "Public insert comments" ON public.comments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update comments" ON public.comments;
CREATE POLICY "Public update comments" ON public.comments FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read user profiles" ON public.user_profiles;
CREATE POLICY "Public read user profiles" ON public.user_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public upsert user profiles" ON public.user_profiles;
CREATE POLICY "Public upsert user profiles" ON public.user_profiles FOR ALL USING (true);
"""

token = os.environ.get("SUPABASE_ACCESS_TOKEN", "").strip() or input("Enter your Supabase Access Token (sbp_...): ").strip()

req = urllib.request.Request(
    f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
    data=json.dumps({"query": SQL_CLEAN_MIGRATION}).encode("utf-8"),
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        resp.read()
        print("  ✓ Tables created successfully with ZERO seed data!")
        print("  ✓ Ready for test users to create dramas, comments, and applications.")
except Exception as e:
    print(f"[!] Error: {e}")
