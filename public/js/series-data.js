const STORAGE_CATALOG_KEY = "minsplay_creator_catalog_v2";
const SYNC_ENDPOINT = "https://lekmsvdbthupiauejffo.supabase.co/functions/v1/smart-responder";

const CORE_FLAGSHIP_DRAMAS = [
  {
    id: "the-dark-bees",
    title: "The Dark Bees",
    shortTitle: "The Dark Bees",
    genre: "Urban Suspense",
    tags: "Creator Original • Suspense",
    badge: "Creator",
    badgeClass: "badge-hot",
    plays: "1.2K",
    posterUrl: "",
    synopsis: "An elite operative infiltrates a clandestine syndicate known only as The Dark Bees.",
    episodes: [{ id: 1, title: "Episode 1: The Infiltration", duration: "1m 30s", isFree: true, src: "" }]
  },
  {
    id: "the-beginning",
    title: "The Beginning",
    shortTitle: "The Beginning",
    genre: "Urban Drama",
    tags: "Counterattack • Drama",
    badge: "Hot",
    badgeClass: "badge-hot",
    plays: "14.2M",
    posterUrl: "",
    synopsis: "Betrayed and left for dead, he returns to claim what was taken from his family.",
    episodes: [{ id: 1, title: "Episode 1: The Return", duration: "1m 30s", isFree: true, src: "" }]
  },
  {
    id: "master-of-dragons",
    title: "Master of Dragons",
    shortTitle: "Master of Dragons",
    genre: "Action & Revenge",
    tags: "Martial Arts • Rebirth",
    badge: "New",
    badgeClass: "badge-new",
    plays: "8.9M",
    posterUrl: "",
    synopsis: "After 5 years in the abyss, the Supreme Dragon King reclaims his sacred domain.",
    episodes: [{ id: 1, title: "Episode 1: Shattered Seal", duration: "1m 30s", isFree: true, src: "" }]
  },
  {
    id: "dragon-god",
    title: "Definitely Not The Dragon God",
    shortTitle: "Dragon God",
    genre: "Urban Fantasy",
    tags: "Hidden Identity • Romance",
    badge: "Hot",
    badgeClass: "badge-hot",
    plays: "11.5M",
    posterUrl: "",
    synopsis: "Treated as a lowly academy servant, Aris hides a terrifying imperial lineage.",
    episodes: [{ id: 1, title: "Episode 1: Unworthy Servant", duration: "1m 30s", isFree: true, src: "" }]
  },
  {
    id: "bastard-hit-daughter",
    title: "Protecting My Daughter",
    shortTitle: "Protecting My Daughter",
    genre: "Family Revenge",
    tags: "Underdog • Justice",
    badge: "Hot",
    badgeClass: "badge-hot",
    plays: "6.4M",
    posterUrl: "",
    synopsis: "When a ruthless tycoon targets his only daughter, a quiet father unseals his combat training.",
    episodes: [{ id: 1, title: "Episode 1: Don't Touch Her", duration: "1m 30s", isFree: true, src: "" }]
  }
];

function loadStoredCatalog() {
  let catalog = [];
  try {
    const raw = localStorage.getItem(STORAGE_CATALOG_KEY);
    if (raw) catalog = JSON.parse(raw);
  } catch (e) {}

  CORE_FLAGSHIP_DRAMAS.forEach((core) => {
    if (!catalog.some((c) => c.id === core.id)) catalog.push({ ...core });
  });

  return catalog;
}

export let DRAMA_CATALOG = loadStoredCatalog();

export function saveCatalogToStorage() {
  try {
    localStorage.setItem(STORAGE_CATALOG_KEY, JSON.stringify(DRAMA_CATALOG));
  } catch (e) {}
}

export function getSeriesById(seriesId) {
  if (!seriesId && DRAMA_CATALOG.length > 0) return DRAMA_CATALOG[0];
  const found = DRAMA_CATALOG.find((s) => s.id === seriesId);
  return found || DRAMA_CATALOG[0] || null;
}

export function savePublishedEpisode({
  seriesId,
  seriesTitle,
  episodeNum,
  title,
  videoUrl,
  posterUrl,
  coinPrice,
  synopsis,
  genre,
}) {
  let drama = DRAMA_CATALOG.find((d) => d.id === seriesId);

  if (!drama) {
    drama = {
      id: seriesId,
      title: seriesTitle || title,
      shortTitle: seriesTitle || title,
      genre: genre || "Urban Drama",
      tags: "Community • Creator Release",
      badge: "Creator",
      badgeClass: "badge-hot",
      plays: "1",
      posterUrl: posterUrl || "",
      synopsis: synopsis || "Original community short drama streaming on Minsplay.",
      episodes: [],
    };
    DRAMA_CATALOG.unshift(drama);
  } else if (posterUrl && !drama.posterUrl) {
    drama.posterUrl = posterUrl;
  }

  const existingIndex = drama.episodes.findIndex((e) => e.id === Number(episodeNum));
  const newEpisode = {
    id: Number(episodeNum),
    title: title || `Episode ${episodeNum}`,
    duration: "1m 30s",
    isFree: Number(coinPrice) === 0,
    src: videoUrl,
    posterUrl: posterUrl || drama.posterUrl || "",
  };

  if (existingIndex >= 0) {
    drama.episodes[existingIndex] = newEpisode;
  } else {
    drama.episodes.push(newEpisode);
    drama.episodes.sort((a, b) => a.id - b.id);
  }

  saveCatalogToStorage();
  return drama;
}

/**
 * Fetches paginated video items from the automated Supabase index
 */
export async function fetchPaginatedVault(page = 1, limit = 6, seriesId = "all") {
  try {
    const res = await fetch(`${SYNC_ENDPOINT}?page=${page}&limit=${limit}&series_id=${seriesId}`);
    if (!res.ok) return { items: [], hasMore: false };
    return await res.json();
  } catch (err) {
    console.warn("[Minsplay Vault] Pagination query error:", err);
    return { items: [], hasMore: false };
  }
}

/**
 * Live syncs R2 media inventory into client catalog and dispatches update event
 */
export async function syncCatalogFromCloudflareR2() {
  try {
    const data = await fetchPaginatedVault(1, 25);
    if (!data.items || data.items.length === 0) return;

    let updated = false;

    data.items.forEach((item) => {
      let drama = DRAMA_CATALOG.find((d) => d.id === item.series_id || item.object_key.includes(d.id));

      if (drama && drama.episodes && drama.episodes[0]) {
        drama.episodes[0].src = item.public_url;
        updated = true;
      }
    });

    if (updated) {
      saveCatalogToStorage();
      window.dispatchEvent(new CustomEvent("catalogUpdated", { detail: DRAMA_CATALOG }));
    }
  } catch (e) {}
}

// Initial sync on startup
syncCatalogFromCloudflareR2();

// Client interval check every 3 minutes (aligns with pg_cron)
setInterval(() => syncCatalogFromCloudflareR2(), 3 * 60 * 1000);
