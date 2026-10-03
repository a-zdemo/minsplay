storage_js = '''import { fetchRemoteUserProfile, syncRemoteUserProfile } from "./profile-api.js";

const PROGRESS_KEY = "minsplay_watch_progress";
const UNLOCKED_KEY = "minsplay_unlocked";
const COINS_KEY = "minsplay_user_coins";
const CHECKIN_KEY = "minsplay_daily_checkin";
const VIP_KEY = "minsplay_vip_status";
const SETTINGS_KEY = "minsplay_user_settings";

function getActiveContext() {
  try {
    const raw = localStorage.getItem("minsplay_auth_session_v1");
    if (raw) {
      const u = JSON.parse(raw);
      if (u && u.id) return { id: u.id, email: u.email, username: u.username };
    }
  } catch {}
  let gId = localStorage.getItem("minsplay_guest_id");
  if (!gId) {
    gId = "guest_" + Math.floor(10000000 + Math.random() * 90000000);
    localStorage.setItem("minsplay_guest_id", gId);
  }
  return { id: gId, email: null, username: "Guest Explorer" };
}

let syncDebounceTimer = null;
function triggerBackgroundCloudSync() {
  clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(async () => {
    const ctx = getActiveContext();
    const coins = getUserCoins();
    const vip = getVipData();
    const checkin = getCheckinData();
    const unlocked = JSON.parse(localStorage.getItem(UNLOCKED_KEY) || "[]");
    await syncRemoteUserProfile({
      id: ctx.id,
      email: ctx.email,
      username: ctx.username,
      coins,
      vipActive: vip.isVip,
      vipExpiry: vip.expiresAt,
      streakData: { streak: checkin.streak, claimedToday: checkin.claimedToday, lastDate: checkin.lastDate },
      unlockedEpisodes: unlocked
    });
  }, 400);
}

export async function hydrateProfileFromDatabase() {
  const ctx = getActiveContext();
  const remote = await fetchRemoteUserProfile(ctx.id);
  if (remote) {
    if (typeof remote.coins === "number") {
      localStorage.setItem(COINS_KEY, remote.coins.toString());
      window.dispatchEvent(new CustomEvent("coinsUpdated", { detail: { coins: remote.coins } }));
    }
    if (Array.isArray(remote.unlocked_episodes)) {
      localStorage.setItem(UNLOCKED_KEY, JSON.stringify(remote.unlocked_episodes));
    }
    if (remote.vip_active && remote.vip_expiry) {
      const expiresAt = new Date(remote.vip_expiry).getTime();
      localStorage.setItem(VIP_KEY, JSON.stringify({ isVip: expiresAt > Date.now(), plan: "monthly", expiresAt }));
      window.dispatchEvent(new CustomEvent("vipUpdated"));
    }
    if (remote.streak_data) {
      localStorage.setItem(CHECKIN_KEY, JSON.stringify(remote.streak_data));
    }
  } else {
    triggerBackgroundCloudSync();
  }
}

// Auto-hydrate immediately
hydrateProfileFromDatabase();
window.addEventListener("authChanged", () => hydrateProfileFromDatabase());

export function saveProgress(seriesId, episodeId, position, duration, seriesTitle = "Drama Series") {
  try {
    const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    all[seriesId] = {
      seriesId, seriesTitle, episodeId, episodeTitle: "Episode " + episodeId,
      position: Math.floor(position), duration: Math.floor(duration),
      percentage: duration > 0 ? Math.min(100, Math.round((position / duration) * 100)) : 0,
      updatedAt: Date.now()
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch (err) {}
}

export function getSeriesProgress(seriesId) {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}")[seriesId] || null; } catch { return null; }
}

export function getAllProgress() {
  try { return Object.values(JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}")).sort((a, b) => b.updatedAt - a.updatedAt); } catch { return []; }
}

export function clearAllProgress() {
  try { localStorage.removeItem(PROGRESS_KEY); window.dispatchEvent(new CustomEvent("progressCleared")); return true; } catch { return false; }
}

export function getVipData() {
  try {
    const raw = localStorage.getItem(VIP_KEY);
    if (!raw) return { isVip: false, plan: "none", expiresAt: 0, daysLeft: 0 };
    const data = JSON.parse(raw);
    const now = Date.now();
    const isVip = Boolean(data.expiresAt && data.expiresAt > now);
    return {
      isVip, plan: isVip ? data.plan || "monthly" : "expired", expiresAt: data.expiresAt || 0,
      daysLeft: isVip ? Math.max(1, Math.ceil((data.expiresAt - now) / 86400000)) : 0
    };
  } catch { return { isVip: false, plan: "none", expiresAt: 0, daysLeft: 0 }; }
}

export function activateVip(plan = "monthly", durationDays = 30) {
  try {
    const now = Date.now();
    const cur = getVipData();
    const base = cur.isVip && cur.expiresAt > now ? cur.expiresAt : now;
    const expiresAt = base + durationDays * 86400000;
    const vipObj = { isVip: true, plan, expiresAt, activatedAt: now };
    localStorage.setItem(VIP_KEY, JSON.stringify(vipObj));
    window.dispatchEvent(new CustomEvent("vipUpdated", { detail: vipObj }));
    triggerBackgroundCloudSync();
    return vipObj;
  } catch { return null; }
}

export function isEpisodeUnlocked(seriesId, episodeId, isFree = false) {
  if (isFree || getVipData().isVip) return true;
  try {
    const unlocked = JSON.parse(localStorage.getItem(UNLOCKED_KEY) || "[]");
    return unlocked.includes(seriesId + "_" + episodeId) || unlocked.includes(episodeId);
  } catch { return false; }
}

export function unlockEpisode(seriesId, episodeId) {
  try {
    const unlocked = JSON.parse(localStorage.getItem(UNLOCKED_KEY) || "[]");
    const key = seriesId + "_" + episodeId;
    if (!unlocked.includes(key)) {
      unlocked.push(key);
      localStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlocked));
      triggerBackgroundCloudSync();
    }
  } catch {}
}

export function getUserCoins() {
  try {
    const val = localStorage.getItem(COINS_KEY);
    return val !== null ? parseInt(val, 10) : 50;
  } catch { return 50; }
}

export function addCoins(amount) {
  try {
    const current = getUserCoins();
    const updated = Math.max(0, current + amount);
    localStorage.setItem(COINS_KEY, updated.toString());
    window.dispatchEvent(new CustomEvent("coinsUpdated", { detail: { coins: updated } }));
    triggerBackgroundCloudSync();
    return updated;
  } catch { return getUserCoins(); }
}

export function spendCoins(amount) {
  try {
    const current = getUserCoins();
    if (current < amount) return false;
    const updated = current - amount;
    localStorage.setItem(COINS_KEY, updated.toString());
    window.dispatchEvent(new CustomEvent("coinsUpdated", { detail: { coins: updated } }));
    triggerBackgroundCloudSync();
    return true;
  } catch { return false; }
}

export function getCheckinData() {
  try {
    const raw = localStorage.getItem(CHECKIN_KEY);
    const data = raw ? JSON.parse(raw) : { lastDate: "", streak: 0 };
    const todayStr = new Date().toISOString().split("T")[0];
    return {
      lastDate: data.lastDate || "", streak: data.streak || 0,
      claimedToday: data.lastDate === todayStr, todayStr
    };
  } catch {
    return { lastDate: "", streak: 0, claimedToday: false, todayStr: new Date().toISOString().split("T")[0] };
  }
}

export function claimDailyReward() {
  const { lastDate, streak, claimedToday, todayStr } = getCheckinData();
  if (claimedToday) return { success: false, reason: "already_claimed" };

  let newStreak = 1;
  if (lastDate) {
    const diff = Math.round((new Date(todayStr).getTime() - new Date(lastDate).getTime()) / 86400000);
    if (diff === 1) newStreak = (streak % 7) + 1;
    else if (diff === 0) return { success: false, reason: "already_claimed" };
  }

  const ladder = [20, 30, 40, 50, 60, 80, 100];
  const rewardCoins = ladder[newStreak - 1] || 20;

  localStorage.setItem(CHECKIN_KEY, JSON.stringify({ lastDate: todayStr, streak: newStreak }));
  addCoins(rewardCoins);
  triggerBackgroundCloudSync();
  return { success: true, reward: rewardCoins, streak: newStreak };
}

const DEFAULT_SETTINGS = { autoplayNext: true, videoQuality: "auto", swipeGestures: true };

export function getUserSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

export function saveUserSetting(key, val) {
  try {
    const current = getUserSettings();
    current[key] = val;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent("settingsUpdated", { detail: current }));
  } catch {}
}
'''

with open("public/js/storage.js", "w", encoding="utf-8") as f:
    f.write(storage_js)
print("  ✓ Step 2 Complete: public/js/storage.js upgraded with live Supabase user_profiles sync")
