const STREAM_CACHE_NAME = "minsplay-stream-vault-v1";
let warmVideoElement = null;
let preloadedEpisodeKey = null;

// Ensure warm video instance is ready in memory
function getWarmVideo() {
  if (!warmVideoElement) {
    warmVideoElement = document.createElement("video");
    warmVideoElement.preload = "auto";
    warmVideoElement.muted = true;
    warmVideoElement.playsInline = true;
  }
  return warmVideoElement;
}

/**
 * Pre-fetches the initial byte chunk of the next episode into Cache Storage
 * and primes a warm video instance for instant decoding.
 */
export async function preloadNextEpisode(seriesId, nextEpisode) {
  if (!nextEpisode || !nextEpisode.src) return;

  const cacheKey = `${seriesId}_ep_${nextEpisode.id}`;
  if (preloadedEpisodeKey === cacheKey) return; // Already cached

  try {
    // 1. Warm video element buffer in memory
    const warmEl = getWarmVideo();
    warmEl.src = nextEpisode.src;
    warmEl.load();

    // 2. Fetch the initial chunk into the browser Cache API
    if ("caches" in window) {
      const cache = await caches.open(STREAM_CACHE_NAME);
      const cachedMatch = await cache.match(nextEpisode.src);

      if (!cachedMatch) {
        // Request first 1.5MB chunk via HTTP Range request
        const res = await fetch(nextEpisode.src, {
          headers: { Range: "bytes=0-1572864" },
        });

        if (res.ok || res.status === 206) {
          const blob = await res.blob();
          const responseToStore = new Response(blob, {
            status: 200,
            headers: {
              "Content-Type": "video/mp4",
              "Content-Length": blob.size.toString(),
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
          await cache.put(nextEpisode.src, responseToStore);
        }
      }
    }

    preloadedEpisodeKey = cacheKey;
    console.log(`[Minsplay Stream Engine] Pre-buffered Episode ${nextEpisode.id} ready for instant play ⚡`);
  } catch (err) {
    console.warn("[Minsplay Stream Engine] Preload warning:", err);
  }
}

/**
 * Resolves a stream URL from the high-speed Cache API if preloaded,
 * falling back to the remote origin.
 */
export async function resolveStreamSource(src) {
  if (!src) return src;

  try {
    if ("caches" in window) {
      const cache = await caches.open(STREAM_CACHE_NAME);
      const match = await cache.match(src);
      if (match) {
        const blob = await match.blob();
        return URL.createObjectURL(blob);
      }
    }
  } catch (e) {
    console.warn("[Minsplay Stream Engine] Cache resolve fallback:", e);
  }

  return src;
}
