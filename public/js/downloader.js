const CACHE_NAME = "minsplay-videos-v1";
const DOWNLOADS_KEY = "minsplay_downloads";

export function getAllDownloads() {
  try {
    return JSON.parse(localStorage.getItem(DOWNLOADS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function isEpisodeDownloaded(seriesId, episodeId) {
  const list = getAllDownloads();
  return list.some((d) => d.seriesId === seriesId && d.episodeId === Number(episodeId));
}

export async function getCachedVideoBlobUrl(src) {
  try {
    if (!("caches" in window)) return null;
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(src);
    if (!cachedResponse) return null;
    const blob = await cachedResponse.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("Minsplay: Error getting cached video blob", err);
    return null;
  }
}

export async function downloadEpisode(series, episode) {
  try {
    if (!("caches" in window)) {
      return { success: false, error: "Offline Cache Storage not supported in browser" };
    }
    const seriesId = series.id;
    const episodeId = episode.id;

    if (isEpisodeDownloaded(seriesId, episodeId)) {
      return { success: true, alreadyDownloaded: true };
    }

    const res = await fetch(episode.src);
    if (!res.ok) throw new Error("Network request failed");

    const blob = await res.blob();
    const sizeBytes = blob.size || 2500000;
    const sizeStr = (sizeBytes / (1024 * 1024)).toFixed(1) + "MB";

    const cache = await caches.open(CACHE_NAME);
    const responseToCache = new Response(blob, {
      headers: {
        "Content-Type": blob.type || "video/mp4",
        "Content-Length": sizeBytes.toString()
      }
    });
    await cache.put(episode.src, responseToCache);

    const downloads = getAllDownloads();
    downloads.unshift({
      seriesId,
      seriesTitle: series.shortTitle || series.title,
      episodeId,
      episodeTitle: episode.title,
      genre: series.genre || "Drama",
      artClass: series.artClass || "art-gold",
      artSymbol: series.artSymbol || "🎬",
      src: episode.src,
      sizeBytes,
      sizeStr,
      downloadedAt: Date.now()
    });
    localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));

    return { success: true, sizeStr };
  } catch (err) {
    console.error("Minsplay download error:", err);
    return { success: false, error: err.message };
  }
}

export async function removeDownload(seriesId, episodeId) {
  try {
    const list = getAllDownloads();
    const target = list.find((d) => d.seriesId === seriesId && d.episodeId === Number(episodeId));
    if (target && "caches" in window) {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(target.src);
    }
    const updated = list.filter((d) => !(d.seriesId === seriesId && d.episodeId === Number(episodeId)));
    localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

export async function clearAllDownloads() {
  try {
    if ("caches" in window) {
      await caches.delete(CACHE_NAME);
    }
    localStorage.removeItem(DOWNLOADS_KEY);
    return true;
  } catch {
    return false;
  }
}

export async function getStorageEstimate() {
  let cachedTotal = 0;
  const list = getAllDownloads();
  list.forEach((d) => (cachedTotal += d.sizeBytes || 0));
  const cachedMb = (cachedTotal / (1024 * 1024)).toFixed(1);

  let availGb = "128.6";
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const freeBytes = Math.max(0, quota - usage);
      availGb = (freeBytes / (1024 * 1024 * 1024)).toFixed(1);
    } catch {}
  }
  return { cachedMb, availGb };
}
