const SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDY4MjEsImV4cCI6MjEwNjM4MjgyMX0.26Lu_-rQX17LKXOSJ98d2OPRYIkfW_7S-8WaMsxqqeg";

export async function fetchRemoteUserProfile(userId) {
  if (!userId) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${encodeURIComponent(userId)}&limit=1`, {
      headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` }
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows && rows.length > 0 ? rows[0] : null;
  } catch {
    return null;
  }
}

export async function syncRemoteUserProfile({ id, email, username, coins, vipActive, vipExpiry, streakData, unlockedEpisodes }) {
  if (!id) return false;
  try {
    const payload = {
      id,
      email: email || null,
      username: username || "User",
      coins: typeof coins === "number" ? coins : 50,
      vip_active: Boolean(vipActive),
      vip_expiry: vipExpiry ? new Date(vipExpiry).toISOString() : null,
      streak_data: streakData || {},
      unlocked_episodes: Array.isArray(unlockedEpisodes) ? unlockedEpisodes : [],
      updated_at: new Date().toISOString()
    };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
      method: "POST",
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch {
    return false;
  }
}
