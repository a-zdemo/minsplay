const STORAGE_CATALOG_KEY = "minsplay_creator_catalog_v2";

function loadStoredCatalog() {
  let catalog = [];
  try {
    const raw = localStorage.getItem(STORAGE_CATALOG_KEY);
    if (raw) catalog = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load catalog from storage", e);
  }

  // Auto-recovery: If "Dark Bees" is in watch progress, restore it
  try {
    const progressRaw = localStorage.getItem("minsplay_watch_progress");
    if (progressRaw) {
      const progress = JSON.parse(progressRaw);
      const darkBees = Object.values(progress).find(
        (p) => p.seriesTitle && p.seriesTitle.toLowerCase().includes("dark bees")
      );
      if (darkBees && !catalog.some((d) => d.id === darkBees.seriesId)) {
        catalog.unshift({
          id: darkBees.seriesId,
          title: darkBees.seriesTitle,
          shortTitle: darkBees.seriesTitle,
          genre: "Urban Drama",
          tags: "Original • Creator Release",
          badge: "Creator",
          badgeClass: "badge-hot",
          plays: "1",
          posterUrl: "",
          synopsis: "Original community drama series on Minsplay.",
          episodes: [
            {
              id: darkBees.episodeId || 1,
              title: darkBees.episodeTitle || "Episode 1",
              duration: "0m 10s",
              isFree: true,
              src: "/videos/sample.mp4",
              posterUrl: "",
            },
          ],
        });
        localStorage.setItem(STORAGE_CATALOG_KEY, JSON.stringify(catalog));
      }
    }
  } catch (e) {}

  return catalog;
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
