const PROGRESS_KEY = "minsplay_watch_progress";
const UNLOCKED_KEY = "minsplay_unlocked";
const COINS_KEY = "minsplay_user_coins";
const CHECKIN_KEY = "minsplay_daily_checkin";

export function saveProgress(seriesId, episodeId, position, duration, seriesTitle = "Drama Series") {
  try {
    const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    all[seriesId] = {
      seriesId,
      seriesTitle,
      episodeId,
      episodeTitle: "Episode " + episodeId,
      position: Math.floor(position),
      duration: Math.floor(duration),
      percentage: duration > 0 ? Math.min(100, Math.round((position / duration) * 100)) : 0,
      updatedAt: Date.now()
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch (err) {
    console.error("Minsplay: Failed to save watch progress", err);
  }
}

export function getSeriesProgress(seriesId) {
  try {
    const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    return all[seriesId] || null;
  } catch (err) {
    return null;
  }
}

export function getAllProgress() {
  try {
    const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    return Object.values(all).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (err) {
    return [];
  }
}

export function isEpisodeUnlocked(seriesId, episodeId, isFree = false) {
  if (isFree) return true;
  try {
    const unlocked = JSON.parse(localStorage.getItem(UNLOCKED_KEY) || "[]");
    const scopedKey = seriesId + "_" + episodeId;
    return unlocked.includes(scopedKey) || unlocked.includes(episodeId);
  } catch (err) {
    return false;
  }
}

export function unlockEpisode(seriesId, episodeId) {
  try {
    const unlocked = JSON.parse(localStorage.getItem(UNLOCKED_KEY) || "[]");
    const scopedKey = seriesId + "_" + episodeId;
    if (!unlocked.includes(scopedKey)) {
      unlocked.push(scopedKey);
      localStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlocked));
    }
  } catch (err) {
    console.error("Minsplay: Failed to save unlock", err);
  }
}

export function getUserCoins() {
  try {
    const val = localStorage.getItem(COINS_KEY);
    return val !== null ? parseInt(val, 10) : 50;
  } catch (err) {
    return 50;
  }
}

export function addCoins(amount) {
  try {
    const current = getUserCoins();
    const updated = Math.max(0, current + amount);
    localStorage.setItem(COINS_KEY, updated.toString());
    window.dispatchEvent(new CustomEvent("coinsUpdated", { detail: { coins: updated } }));
    return updated;
  } catch (err) {
    console.error("Minsplay: Failed to add coins", err);
    return getUserCoins();
  }
}

export function spendCoins(amount) {
  try {
    const current = getUserCoins();
    if (current < amount) return false;
    const updated = current - amount;
    localStorage.setItem(COINS_KEY, updated.toString());
    window.dispatchEvent(new CustomEvent("coinsUpdated", { detail: { coins: updated } }));
    return true;
  } catch (err) {
    console.error("Minsplay: Failed to spend coins", err);
    return false;
  }
}

export function getCheckinData() {
  try {
    const raw = localStorage.getItem(CHECKIN_KEY);
    const data = raw ? JSON.parse(raw) : { lastDate: "", streak: 0 };
    const todayStr = new Date().toISOString().split("T")[0];
    return {
      lastDate: data.lastDate || "",
      streak: data.streak || 0,
      claimedToday: data.lastDate === todayStr,
      todayStr
    };
  } catch (err) {
    return {
      lastDate: "",
      streak: 0,
      claimedToday: false,
      todayStr: new Date().toISOString().split("T")[0]
    };
  }
}

export function claimDailyReward() {
  const { lastDate, streak, claimedToday, todayStr } = getCheckinData();
  if (claimedToday) {
    return { success: false, reason: "already_claimed" };
  }

  let newStreak = 1;
  if (lastDate) {
    const lastTime = new Date(lastDate).getTime();
    const todayTime = new Date(todayStr).getTime();
    const diffDays = Math.round((todayTime - lastTime) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak = (streak % 7) + 1;
    } else if (diffDays === 0) {
      return { success: false, reason: "already_claimed" };
    }
  }

  const rewardLadder = [20, 30, 40, 50, 60, 80, 100];
  const rewardCoins = rewardLadder[newStreak - 1] || 20;

  localStorage.setItem(CHECKIN_KEY, JSON.stringify({ lastDate: todayStr, streak: newStreak }));
  addCoins(rewardCoins);

  return { success: true, reward: rewardCoins, streak: newStreak };
}
