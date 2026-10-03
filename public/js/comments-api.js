const SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDY4MjEsImV4cCI6MjEwNjM4MjgyMX0.26Lu_-rQX17LKXOSJ98d2OPRYIkfW_7S-8WaMsxqqeg";

export async function fetchEpisodeComments(seriesId, episodeId) {
  try {
    const epNum = Number(episodeId) || 1;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/comments?series_id=eq.${encodeURIComponent(seriesId)}&episode_id=eq.${epNum}&order=created_at.desc`, {
      headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.warn("fetchEpisodeComments error:", e);
    return [];
  }
}

export async function postEpisodeComment({ seriesId, episodeId, content, user }) {
  try {
    const payload = {
      series_id: seriesId,
      episode_id: Number(episodeId) || 1,
      user_id: user?.id || null,
      username: user?.username || (user?.email ? user.email.split("@")[0] : "Drama Fan"),
      avatar: user?.avatar || "/icons/icon-192.png",
      content: content.trim(),
      likes: 0
    };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
      method: "POST",
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Comment post failed");
    return await res.json();
  } catch (e) {
    console.error("postEpisodeComment error:", e);
    return null;
  }
}

export async function likeEpisodeComment(commentId, currentLikes = 0) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/comments?id=eq.${encodeURIComponent(commentId)}`, {
      method: "PATCH",
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ likes: currentLikes + 1 })
    });
  } catch (e) {
    console.warn("like comment error:", e);
  }
}
