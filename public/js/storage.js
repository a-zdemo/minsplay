// Storage keys
const PROGRESS_KEY = "minsplay_watch_progress";
const UNLOCKED_KEY = "minsplay_unlocked";

/**
 * Save playback position for an episode under its specific series
 */
export function saveProgress(seriesId, episodeId, position, duration, seriesTitle = "Drama Series") {
  try {
    const allProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    allProgress[seriesId] = {
      seriesId,
      seriesTitle,
      episodeId,
      episodeTitle: `Episode ${episodeId}`,
      position: Math.floor(position),
      duration: Math.floor(duration),
      percentage: duration > 0 ? Math.min(100, Math.round((position / duration) * 100)) : 0,
      updatedAt: Date.now(),
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress));
  } catch (err) {
    console.error("Minsplay: Failed to save watch progress", err);
  }
}

/**
 * Retrieve saved progress for a series
 */
export function getSeriesProgress(seriesId) {
  try {
    const allProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    return allProgress[seriesId] || null;
  } catch {
    return null;
  }
}

/**
 * Get all continue watching records sorted by most recent
 */
export function getAllProgress() {
  try {
    const allProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    return Object.values(allProgress).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

/**
 * Entitlements: Check if an episode is unlocked for a given series.
 * Scoped by `${seriesId}_${episodeId}` with fallback for legacy numeric keys.
 */
export function isEpisodeUnlocked(seriesId, episodeId, isFree = false) {
  if (isFree) return true;
  try {
    const unlocked = JSON.parse(localStorage.getItem(UNLOCKED_KEY) || "[]");
    const scopedKey = `${seriesId}_${episodeId}`;
    return unlocked.includes(scopedKey) || unlocked.includes(episodeId);
  } catch {
    return false;
  }
}

/**
 * Entitlements: Grant access to an episode under a series
 */
export function unlockEpisode(seriesId, episodeId) {
  try {
    const unlocked = JSON.parse(localStorage.getItem(UNLOCKED_KEY) || "[]");
    const scopedKey = `${seriesId}_${episodeId}`;
    if (!unlocked.includes(scopedKey)) {
      unlocked.push(scopedKey);
      localStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlocked));
    }
  } catch (err) {
    console.error("Minsplay: Failed to save unlock", err);
  }
}