
// Storage keys const PROGRESS_KEY = "minsplay_watch_progress"; const UNLOCKED_KEY = "minsplay_unlocked"; const COINS_KEY = "minsplay_user_coins"; const CHECKIN_KEY = "minsplay_daily_checkin";

/

Save playback position for an episode under its specific series */ export function saveProgress(seriesId, episodeId, position, duration, seriesTitle = "Drama Series") { try { const allProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); allProgress[seriesId] = { seriesId, seriesTitle, episodeId, episodeTitle: Episode ${episodeId}, position: Math.floor(position), duration: Math.floor(duration), percentage: duration > 0 ? Math.min(100, Math.round((position / duration) * 100)) : 0, updatedAt: Date.now(), }; localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress)); } catch (err) { console.error("Minsplay: Failed to save watch progress", err); } }
/

Retrieve saved progress for a series */ export function getSeriesProgress(seriesId) { try { const allProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); return allProgress[seriesId] || null; } catch { return null; } }
/

Get all continue watching records sorted by most recent */ export function getAllProgress() { try { const allProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); return Object.values(allProgress).sort((a, b) => b.updatedAt - a.updatedAt); } catch { return []; } }
/

Entitlements: Check if an episode is unlocked for a given series.
Scoped by ${seriesId}_${episodeId} with fallback for legacy numeric keys. */ export function isEpisodeUnlocked(seriesId, episodeId, isFree = false) { if (isFree) return true; try { const unlocked = JSON.parse(localStorage.getItem(UNLOCKED_KEY) || "[]"); const scopedKey = ${seriesId}_${episodeId}; return unlocked.includes(scopedKey) || unlocked.includes(episodeId); } catch { return false; } }
/

Entitlements: Grant access to an episode under a series */ export function unlockEpisode(seriesId, episodeId) { try { const unlocked = JSON.parse(localStorage.getItem(UNLOCKED_KEY) || "[]"); const scopedKey = ${seriesId}_${episodeId}; if (!unlocked.includes(scopedKey)) { unlocked.push(scopedKey); localStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlocked)); } } catch (err) { console.error("Minsplay: Failed to save unlock", err); } }
/* ========================================================================== Section 19: Coin Economy & 7-Day Check-in Streak Engine ========================================================================== */

/

Retrieve current user coin balance (defaults to 50 welcome coins) */ export function getUserCoins() { try { const val = localStorage.getItem(COINS_KEY); return val !== null ? parseInt(val, 10) : 50; } catch { return 50; } }
/

Add coins to wallet and broadcast balance change event */ export function addCoins(amount) { try { const current = getUserCoins(); const updated = Math.max(0, current + amount); localStorage.setItem(COINS_KEY, updated.toString()); window.dispatchEvent(new CustomEvent("coinsUpdated", { detail: { coins: updated } })); return updated; } catch (err) { console.error("Minsplay: Failed to add coins", err); return getUserCoins(); } }
/

Spend coins if sufficient balance exists */ export function spendCoins(amount) { try { const current = getUserCoins(); if (current < amount) return false; const updated = current - amount; localStorage.setItem(COINS_KEY, updated.toString()); window.dispatchEvent(new CustomEvent("coinsUpdated", { detail: { coins: updated } })); return true; } catch (err) { console.error("Minsplay: Failed to spend coins", err); return false; } }
/

Get daily check-in metadata, streak count, and today's status */ export function getCheckinData() { try { const raw = localStorage.getItem(CHECKIN_KEY); const data = raw ? JSON.parse(raw) : { lastDate: "", streak: 0 }; const todayStr = new Date().toISOString().split("T")[0]; const claimedToday = data.lastDate === todayStr; return { lastDate: data.lastDate || "", streak: data.streak || 0, claimedToday, todayStr, }; } catch { return { lastDate: "", streak: 0, claimedToday: false, todayStr: new Date().toISOString().split("T")[0], }; } }
/

Claim today's daily reward */ export function claimDailyReward() { const { lastDate, streak, claimedToday, todayStr } = getCheckinData(); if (claimedToday) { return { success: false, reason: "already_claimed" }; }
let newStreak = 1; if (lastDate) { const lastTime = new Date(lastDate).getTime(); const todayTime = new Date(todayStr).getTime(); const diffDays = Math.round((todayTime - lastTime) / (1000 * 60 * 60 * 24));

if (diffDays === 1) { newStreak = (streak % 7) + 1; } else if (diffDays === 0) { return { success: false, reason: "already_claimed" }; } else { newStreak = 1; } } else { newStreak = 1; }

// 7-day reward ladder: Day 1=20, Day 2=30, Day 3=40, Day 4=50, Day 5=60, Day 6=80, Day 7=100 const rewardLadder = [20, 30, 40, 50, 60, 80, 100]; const rewardCoins = rewardLadder[newStreak - 1] || 20;

const record = { lastDate: todayStr, streak: newStreak }; localStorage.setItem(CHECKIN_KEY, JSON.stringify(record)); addCoins(rewardCoins);

return { success: true, reward: rewardCoins, streak: newStreak }; }

