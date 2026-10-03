export async function syncVaultToDramasTable() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/r2_media_vault?select=*&order=created_at.asc`, {
      headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` }
    });
    if (!res.ok) return 0;
    const assets = await res.json();
    if (!assets || assets.length === 0) return 0;
    const map = {};
    assets.forEach(a => {
      const sId = a.series_id || "the-dark-bees";
      if (!map[sId]) map[sId] = [];
      map[sId].push(a);
    });
    for (const sId of Object.keys(map)) {
      const items = map[sId];
      items.sort((a, b) => (a.object_key || a.filename || "").localeCompare(b.object_key || b.filename || ""));
      const episodes = items.map((it, idx) => ({
        id: idx + 1,
        title: it.title || `Episode ${idx + 1}`,
        duration: "1m 30s",
        isFree: (idx + 1) <= 2,
        src: it.public_url || `https://pub-446cc5245dc94ce0afede5f9a591d746.r2.dev/${it.object_key}`,
        posterUrl: ""
      }));
      const title = sId === "the-dark-bees" ? "The Dark Bees" : (sId === "the-beginning" ? "The Beginning" : sId.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
      const genre = sId === "the-dark-bees" ? "Urban Suspense" : "Urban Drama";
      const synopsis = sId === "the-dark-bees" ? "A high-stakes vertical suspense thriller uncovering dark underworld syndicates." : "An empire falls and a ruthless heir rises to claim the throne.";
      await saveDramaToDatabase({
        id: sId, title, genre, synopsis, badge: "HOT", badgeClass: "badge-hot", posterUrl: "", plays: "1.2K", status: "published", episodes
      });
    }
    return Object.keys(map).length;
  } catch (e) { return 0; }
}

const SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDY4MjEsImV4cCI6MjEwNjM4MjgyMX0.26Lu_-rQX17LKXOSJ98d2OPRYIkfW_7S-8WaMsxqqeg";

export let DRAMA_CATALOG = [];

export function getSeriesById(seriesId) {
  if (!seriesId && DRAMA_CATALOG.length > 0) return DRAMA_CATALOG[0];
  const found = DRAMA_CATALOG.find((s) => s.id === seriesId);
  return found || DRAMA_CATALOG[0] || null;
}

export async function fetchCatalogFromDatabase() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/dramas?order=created_at.desc`, {
      headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` }
    });
    if (res.ok) {
      const rows = await res.json();
      DRAMA_CATALOG = rows.map((r) => ({
        id: r.id,
        title: r.title,
        shortTitle: r.title,
        genre: r.genre || "Urban Drama",
        synopsis: r.synopsis || "",
        badge: r.badge || "NEW",
        badgeClass: r.badge_class || "badge-new",
        plays: r.plays || "0",
        posterUrl: r.poster_url || "",
        status: r.status || "published",
        creatorId: r.creator_id || "",
        episodes: Array.isArray(r.episodes) ? r.episodes : []
      }));
      window.dispatchEvent(new CustomEvent("catalogUpdated", { detail: { catalog: DRAMA_CATALOG } }));
    }
  } catch (err) {
    console.warn("Failed to fetch dramas from Supabase:", err);
  }
  return DRAMA_CATALOG;
}

fetchCatalogFromDatabase();

export async function saveDramaToDatabase(drama) {
  try {
    const payload = {
      id: drama.id,
      title: drama.title,
      genre: drama.genre || "Urban Drama",
      synopsis: drama.synopsis || "",
      badge: drama.badge || "NEW",
      badge_class: drama.badgeClass || "badge-new",
      poster_url: drama.posterUrl || "",
      plays: drama.plays || "0",
      status: drama.status || "published",
      episodes: drama.episodes || [],
      updated_at: new Date().toISOString()
    };
    await fetch(`${SUPABASE_URL}/rest/v1/dramas`, {
      method: "POST",
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(payload)
    });
    await fetchCatalogFromDatabase();
  } catch (e) {
    console.error("Save drama error:", e);
  }
}

export async function savePublishedEpisode({ seriesId, seriesTitle, episodeNum, title, videoUrl, posterUrl, coinPrice, synopsis, genre }) {
  let drama = DRAMA_CATALOG.find((d) => d.id === seriesId);
  if (!drama) {
    drama = {
      id: seriesId,
      title: seriesTitle || title,
      genre: genre || "Urban Drama",
      synopsis: synopsis || "",
      badge: "NEW",
      badgeClass: "badge-new",
      plays: "0",
      posterUrl: posterUrl || "",
      episodes: []
    };
    DRAMA_CATALOG.unshift(drama);
  }
  const epIndex = drama.episodes.findIndex((e) => e.id === Number(episodeNum));
  const newEpisode = {
    id: Number(episodeNum),
    title: title || `Episode ${episodeNum}`,
    duration: "1m 30s",
    isFree: Number(coinPrice) === 0,
    src: videoUrl,
    posterUrl: posterUrl || drama.posterUrl || ""
  };
  if (epIndex >= 0) drama.episodes[epIndex] = newEpisode;
  else {
    drama.episodes.push(newEpisode);
    drama.episodes.sort((a, b) => a.id - b.id);
  }
  await saveDramaToDatabase(drama);
  return drama;
}

export function saveCatalogToStorage() {}
export async function syncCatalogFromVault() { return fetchCatalogFromDatabase(); }
