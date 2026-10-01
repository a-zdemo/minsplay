const STORAGE_CATALOG_KEY = "minsplay_creator_catalog_v2";

// Load user-published dramas from localStorage or start fresh
function loadStoredCatalog() {
  try {
    const raw = localStorage.getItem(STORAGE_CATALOG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load catalog from storage", e);
  }
  return [];
}

export let DRAMA_CATALOG = loadStoredCatalog();

export function saveCatalogToStorage() {
  try {
    localStorage.setItem(STORAGE_CATALOG_KEY, JSON.stringify(DRAMA_CATALOG));
  } catch (e) {
    console.error("Failed to persist catalog", e);
  }
}

export function getSeriesById(seriesId) {
  if (!seriesId && DRAMA_CATALOG.length > 0) return DRAMA_CATALOG[0];
  const found = DRAMA_CATALOG.find((s) => s.id === seriesId);
  return found || (DRAMA_CATALOG.length > 0 ? DRAMA_CATALOG[0] : null);
}

export function savePublishedEpisode({ seriesId, seriesTitle, episodeNum, title, videoUrl, posterUrl, coinPrice, synopsis, genre }) {
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
      episodes: []
    };
    DRAMA_CATALOG.unshift(drama);
  } else if (posterUrl && !drama.posterUrl) {
    drama.posterUrl = posterUrl;
  }

  // Ensure no duplicate episode numbers
  const existingIndex = drama.episodes.findIndex((e) => e.id === Number(episodeNum));
  const newEpisode = {
    id: Number(episodeNum),
    title: title || `Episode ${episodeNum}`,
    duration: "1m 30s",
    isFree: Number(coinPrice) === 0,
    src: videoUrl,
    posterUrl: posterUrl || drama.posterUrl || ""
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
