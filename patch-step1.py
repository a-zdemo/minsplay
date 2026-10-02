import re

# 1. Update series-data.js to include dynamic vault sync
series_data_code = '''const STORAGE_CATALOG_KEY = "minsplay_creator_catalog_v2";
const R2_BASE = "https://pub-446cc5245dc94ce0afede5f9a591d746.r2.dev";
const ENDPOINT_URL = "https://lekmsvdbthupiauejffo.supabase.co/functions/v1/smart-responder";

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
      episodes: []
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

export async function syncCatalogFromVault(triggerR2Sync = false) {
  try {
    if (triggerR2Sync) {
      await fetch(`${ENDPOINT_URL}?action=sync`).catch(() => {});
    }
    const res = await fetch(`${ENDPOINT_URL}?limit=100`);
    const data = await res.json();
    if (!data || !data.items || data.items.length === 0) return DRAMA_CATALOG;

    const grouped = {};
    data.items.forEach((item) => {
      const sId = item.series_id || "the-dark-bees";
      if (!grouped[sId]) grouped[sId] = [];
      grouped[sId].push(item);
    });

    Object.keys(grouped).forEach((sId) => {
      grouped[sId].sort((a, b) => (a.filename || a.object_key).localeCompare(b.filename || b.object_key));
      let drama = DRAMA_CATALOG.find((d) => d.id === sId);
      if (!drama) {
        const sample = grouped[sId][0];
        drama = {
          id: sId,
          title: sample.title || sId.replace(/-/g, " ").replace(/\\b\\w/g, (c) => c.toUpperCase()),
          shortTitle: sample.title || sId,
          genre: "Urban Drama",
          tags: "Cloudflare Sync • Creator Original",
          badge: "Creator",
          badgeClass: "badge-hot",
          plays: "1.2K",
          posterUrl: "",
          synopsis: "Original community drama streaming on Minsplay.",
          episodes: []
        };
        DRAMA_CATALOG.push(drama);
      }

      const existingMap = new Map((drama.episodes || []).map((e) => [e.src, e]));
      drama.episodes = grouped[sId].map((item, index) => {
        const epNum = index + 1;
        const prev = existingMap.get(item.public_url);
        return {
          id: epNum,
          title: prev ? prev.title : `Episode ${epNum}`,
          duration: prev ? prev.duration : "1m 30s",
          isFree: prev ? prev.isFree : (epNum <= 2),
          src: item.public_url,
          posterUrl: drama.posterUrl || ""
        };
      });
    });

    saveCatalogToStorage();
    window.dispatchEvent(new CustomEvent("catalogUpdated", { detail: { catalog: DRAMA_CATALOG } }));
    return DRAMA_CATALOG;
  } catch (err) {
    console.warn("Failed to sync catalog from vault:", err);
    return DRAMA_CATALOG;
  }
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
  saveCatalogToStorage();
  return drama;
}
'''
with open("public/js/series-data.js", "w", encoding="utf-8") as f:
    f.write(series_data_code)
print("Updated public/js/series-data.js ✓")

# 2. Update app.js to trigger background sync on boot
with open("public/js/app.js", "r", encoding="utf-8") as f:
    app_js = f.read()

if "syncCatalogFromVault" not in app_js:
    app_js = 'import { syncCatalogFromVault } from "./series-data.js";\n' + app_js
    app_js = app_js.replace("initRouter();", "syncCatalogFromVault(false);\n    initRouter();")
    with open("public/js/app.js", "w", encoding="utf-8") as f:
        f.write(app_js)
    print("Updated public/js/app.js to sync catalog on startup ✓")
