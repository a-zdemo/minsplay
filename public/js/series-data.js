const STORAGE_CATALOG_KEY = "minsplay_creator_catalog_v2";
const R2_BASE = "https://pub-446cc5245dc94ce0afede5f9a591d746.r2.dev";

function loadStoredCatalog() {
  try {
    const raw = localStorage.getItem(STORAGE_CATALOG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  return [
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
      synopsis: "An elite operative infiltrates a clandestine syndicate known only as The Dark Bees. Every secret comes with a lethal price.",
      episodes: [
        { id: 1, title: "Episode 1: The Infiltration", duration: "1m 30s", isFree: true, src: `${R2_BASE}/episodes/the-dark-bees/1790818784017_1000137014.mp4` },
        { id: 2, title: "Episode 2: The Trap", duration: "1m 30s", isFree: true, src: `${R2_BASE}/episodes/the-dark-bees/1790818882138_1000137015.mp4` },
        { id: 3, title: "Episode 3: Secrets Revealed", duration: "1m 30s", isFree: false, src: `${R2_BASE}/episodes/the-dark-bees/1790819054891_1000137017.mp4` },
        { id: 4, title: "Episode 4: Lethal Retribution", duration: "1m 30s", isFree: false, src: `${R2_BASE}/episodes/the-dark-bees/1790819106178_1000137018.mp4` },
        { id: 5, title: "Episode 5: The Final Stand", duration: "1m 30s", isFree: false, src: `${R2_BASE}/episodes/the-dark-bees/1790819195179_1000137019.mp4` }
      ]
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
      episodes: [
        { id: 1, title: "Episode 1: The Return", duration: "1m 30s", isFree: true, src: `${R2_BASE}/episodes/the-beginning/1790818542132_1000137014.mp4` }
      ]
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
      episodes: [
        { id: 1, title: "Episode 1: Shattered Seal", duration: "1m 30s", isFree: true, src: `${R2_BASE}/episodes/the-beginning/1790818542132_1000137014.mp4` }
      ]
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
      episodes: [
        { id: 1, title: "Episode 1: Unworthy Servant", duration: "1m 30s", isFree: true, src: `${R2_BASE}/episodes/the-beginning/1790818542132_1000137014.mp4` }
      ]
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
      episodes: [
        { id: 1, title: "Episode 1: Don't Touch Her", duration: "1m 30s", isFree: true, src: `${R2_BASE}/episodes/the-beginning/1790818542132_1000137014.mp4` }
      ]
    }
  ];
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
  } else {
    if (seriesTitle) drama.title = seriesTitle;
    if (posterUrl && !drama.posterUrl) drama.posterUrl = posterUrl;
  }

  const epIndex = drama.episodes.findIndex((e) => e.id === Number(episodeNum));
  const newEpisode = {
    id: Number(episodeNum),
    title: title || `Episode ${episodeNum}`,
    duration: "1m 30s",
    isFree: Number(coinPrice) === 0,
    src: videoUrl,
    posterUrl: posterUrl || drama.posterUrl || "",
  };

  if (epIndex >= 0) {
    drama.episodes[epIndex] = newEpisode;
  } else {
    drama.episodes.push(newEpisode);
    drama.episodes.sort((a, b) => a.id - b.id);
  }

  saveCatalogToStorage();
  return drama;
}
