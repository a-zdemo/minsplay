import json
import os
import sys
import urllib.request
import urllib.error

PROJECT_REF = "lekmsvdbthupiauejffo"

SQL_TABLES = """
-- 1. Create the Global Reward Tasks Table
CREATE TABLE IF NOT EXISTS public.reward_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_coins INT NOT NULL DEFAULT 30,
  icon TEXT DEFAULT '🎁',
  action_type TEXT NOT NULL DEFAULT 'ad',
  btn_label TEXT DEFAULT 'Go',
  target_url TEXT,
  max_progress INT DEFAULT 1,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create the User Task Progress & Claim Ledger
CREATE TABLE IF NOT EXISTS public.user_task_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  task_id TEXT NOT NULL REFERENCES public.reward_tasks(id) ON DELETE CASCADE,
  progress INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  last_claimed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_email, task_id)
);

-- 3. Row-Level Security
ALTER TABLE public.reward_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_task_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for active reward tasks" ON public.reward_tasks;
CREATE POLICY "Public read for active reward tasks"
  ON public.reward_tasks FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Full access for managing reward tasks" ON public.reward_tasks;
CREATE POLICY "Full access for managing reward tasks"
  ON public.reward_tasks FOR ALL USING (true);

DROP POLICY IF EXISTS "Users read own progress" ON public.user_task_progress;
CREATE POLICY "Users read own progress"
  ON public.user_task_progress FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own progress" ON public.user_task_progress;
CREATE POLICY "Users update own progress"
  ON public.user_task_progress FOR ALL USING (true);
"""

SQL_SEED = """
-- 4. Seed Default StoryMatrix Reward Tasks
INSERT INTO public.reward_tasks (id, title, description, reward_coins, icon, action_type, btn_label, target_url, max_progress, sort_order)
VALUES
  ('task_tg', 'Join Telegram Channel', '+ 30 reward coins', 30, '✈️', 'telegram', 'Go', 'https://t.me/minsplay', 1, 1),
  ('task_ad_loop', 'Earn rewards (0/15)', 'Watch a video to earn 20 coins', 20, '📹', 'ad', 'Watch', NULL, 15, 2),
  ('task_big_coins', 'Get more coins', 'Up to 9999 coins', 50, '🎁', 'vip', 'Go', NULL, 1, 3),
  ('task_invite', 'Invite friends', 'Earn up to 500 coins daily', 50, '👤', 'invite', 'Invite', NULL, 1, 4),
  ('task_share', 'Share with friends', '+ 30 Reward coins', 30, '↗️', 'share', 'Go', NULL, 1, 5),
  ('task_watch_5m', 'Watch for 5 mins', '+ 10 Reward coins', 10, '🕒', 'watch', 'Go', NULL, 1, 6),
  ('task_watch_15m', 'Watch for 15 mins', '+ 20 Reward coins', 20, '🕒', 'watch', 'Go', NULL, 1, 7)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  reward_coins = EXCLUDED.reward_coins,
  sort_order = EXCLUDED.sort_order;
"""

FULL_QUERY = SQL_TABLES + "\n" + SQL_SEED

def resolve_token():
    token = os.environ.get("SUPABASE_ACCESS_TOKEN", "").strip()
    if not token and len(sys.argv) > 1:
        token = sys.argv[1].strip()
    if not token:
        token = input("Enter your Supabase Access Token (sbp_...): ").strip()
    return token

def run_migration():
    token = resolve_token()
    if not token:
        print("Error: Access token cannot be empty.")
        sys.exit(1)

    print(f"\nConnecting to Supabase Database for project: {PROJECT_REF}...")
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
    payload = json.dumps({"query": FULL_QUERY}).encode("utf-8")

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
        with urllib.request.urlopen(req) as resp:
            resp.read()
            print("\nDatabase migration completed successfully! 🎉")
            print("  • public.reward_tasks created & seeded with 7 tasks")
            print("  • public.user_task_progress ledger created")
            print("  • Row-Level Security access policies active")
    except urllib.error.HTTPError as e:
        print(f"\nMigration failed with HTTP {e.code}: {e.read().decode('utf-8')}")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
