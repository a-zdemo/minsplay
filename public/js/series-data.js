const STORAGE_CATALOG_KEY = "minsplay_creator_catalog_v2";
const R2_PUBLIC_BASE = "https://pub-446cc5245dc94ce0afede5f9a591d746.r2.dev";

// Verified reliable short-drama test stream for instant verification
const VERIFIED_STREAM = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

function loadStoredCatalog() {
  let catalog = [];
  try {
    const raw = localStorage.getItem(STORAGE_CATALOG_KEY);
    if (raw) catalog = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load catalog", e);
  }

  const darkBeesSeries = {
    id: "the-dark-bees",
    title: "The Dark Bees",
    shortTitle: "The Dark Bees",
    genre: "Urban Suspense",
    tags: "Creator Original • Suspense",
    badge: "Creator",
    badgeClass: "badge-hot",
    plays: "1.2K",
    posterUrl: "",
    synopsis: "An elite operative infiltrates a clandestine syndicate known only as The Dark Bees. Every secret comes with a lethal price.",
    episodes: [
      {
        id: 1,
        title: "Episode 1: The Infiltration",
        duration: "0m 15s",
        isFree: true,
        // Active stream endpoint
        src: VERIFIED_STREAM,
        posterUrl: "",
      }
    ]
  };

  const darkBeesIndex = catalog.findIndex((d) => d.id === "the-dark-bees");
  if (darkBeesIndex >= 0) {
    // If the stored episode was pointing to an unverified or 404 clip, update it
    const ep = catalog[darkBeesIndex].episodes && catalog[darkBeesIndex].episodes[0];
    if (!ep || ep.src.includes("1790818188825_test_clip.mp4")) {
      catalog[darkBeesIndex] = darkBeesSeries;
      localStorage.setItem(STORAGE_CATALOG_KEY, JSON.stringify(catalog));
    }
  } else {
    catalog.unshift(darkBeesSeries);
    localStorage.setItem(STORAGE_CATALOG_KEY, JSON.stringify(catalog));
  }

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
