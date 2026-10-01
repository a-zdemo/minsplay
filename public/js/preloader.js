const STREAM_CACHE_NAME = "minsplay-stream-vault-v1";
let warmVideoElement = null;
let preloadedEpisodeKey = null;

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
 * Pre-warms the next episode using background browser prefetching
 */
export async function preloadNextEpisode(seriesId, nextEpisode) {
  if (!nextEpisode || !nextEpisode.src) return;

  const cacheKey = `${seriesId}_ep_${nextEpisode.id}`;
  if (preloadedEpisodeKey === cacheKey) return;

  try {
    // Prime decoding pipeline with warm element
    const warmEl = getWarmVideo();
    warmEl.src = nextEpisode.src;
    warmEl.load();

    preloadedEpisodeKey = cacheKey;
    console.log(`[Minsplay Stream Engine] Pre-buffering primed for Ep ${nextEpisode.id} ⚡`);
  } catch (err) {
    console.warn("[Minsplay Stream Engine] Preload notice:", err);
  }
}

/**
 * Resolves verified stream sources
 */
export async function resolveStreamSource(src) {
  if (!src) return "";
  return src;
}
