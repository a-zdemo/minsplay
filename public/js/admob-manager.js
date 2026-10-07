import { Capacitor } from "@capacitor/core";
import { AdMob, RewardAdPluginEvents, InterstitialAdPluginEvents } from "@capacitor-community/admob";
import { showAppToast } from "./router.js";

const SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDY4MjEsImV4cCI6MjEwNjM4MjgyMX0.26Lu_-rQX17LKXOSJ98d2OPRYIkfW_7S-8WaMsxqqeg";

// Official Google AdMob Test Units
const GOOGLE_DEMO_REWARDED_UNIT = "ca-app-pub-3940256099942544/5224354917";
const GOOGLE_DEMO_INTERSTITIAL_UNIT = "ca-app-pub-3940256099942544/1033173712";

const DEFAULT_CONFIG = {
  id: "global_config",
  enabled: true,
  test_mode: true,
  app_id: "ca-app-pub-6215013187981045~8480325432",
  rewarded_unlock_unit: "ca-app-pub-6215013187981045/9023250919",
  rewarded_unlock_coins: 30,
  rewarded_task_unit: "ca-app-pub-6215013187981045/2241471717",
  rewarded_task_coins: 20,
  rewarded_task_limit: 15,
  interstitial_unit: "ca-app-pub-6215013187981045/8592006078",
  interstitial_frequency: 3,
  banner_unit: "",
  banner_home_enabled: true,
  banner_rewards_enabled: true
};

let cachedConfig = { ...DEFAULT_CONFIG };
let isSdkInitialized = false;
let episodesWatchedCount = 0;

// Global lock: Prevents video from playing while ANY ad is covering the screen
export let isAdDisplayingActive = false;

export function pauseActiveVideo() {
  const video = document.getElementById("minsplay-video");
  if (video && !video.paused) {
    video.pause();
  }
}

export async function initNativeAdMobSDK() {
  if (isSdkInitialized || !Capacitor.isNativePlatform()) return;
  try {
    await AdMob.initialize({ initializeForTesting: true });
    isSdkInitialized = true;
    console.log("✓ Native Google Mobile Ads SDK initialized");
  } catch (err) {
    console.warn("AdMob initialization notice:", err);
  }
}

initNativeAdMobSDK();

export async function fetchAdmobConfig() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/admob_config?id=eq.global_config&limit=1`, {
      headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` }
    });
    if (res.ok) {
      const rows = await res.json();
      if (rows && rows.length > 0) {
        cachedConfig = { ...DEFAULT_CONFIG, ...rows[0] };
        localStorage.setItem("minsplay_admob_config", JSON.stringify(cachedConfig));
      }
    }
  } catch (e) {
    try {
      const stored = localStorage.getItem("minsplay_admob_config");
      if (stored) cachedConfig = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    } catch {}
  }
  return cachedConfig;
}

export function getAdmobConfig() {
  return cachedConfig;
}

fetchAdmobConfig();

export async function showRewardedVideo({ placement = "episode_unlock", onReward, onDismiss }) {
  const config = getAdmobConfig();
  if (!config.enabled) {
    if (typeof onReward === "function") onReward();
    return;
  }

  pauseActiveVideo();

  if (Capacitor.isNativePlatform()) {
    try {
      await initNativeAdMobSDK();
      showAppToast("Loading Ad... ⏳");

      const targetUnit = config.test_mode
        ? GOOGLE_DEMO_REWARDED_UNIT
        : (placement === "rewards_loop" ? config.rewarded_task_unit : config.rewarded_unlock_unit);

      let isRewardEarned = false;
      isAdDisplayingActive = true;

      const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (item) => {
        console.log("✓ AdMob: User earned reward:", item);
        isRewardEarned = true;
      });

      const dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        rewardListener.remove();
        dismissListener.remove();
        isAdDisplayingActive = false;

        setTimeout(() => {
          if (isRewardEarned) {
            if (typeof onReward === "function") onReward();
          } else {
            showAppToast("Watch the full ad to unlock the episode 🔒");
            if (typeof onDismiss === "function") onDismiss();
          }
        }, 250);
      });

      const failListener = await AdMob.addListener(RewardAdPluginEvents.FailedToShow, (err) => {
        rewardListener.remove();
        dismissListener.remove();
        failListener.remove();
        isAdDisplayingActive = false;
        console.warn("Ad failed to show:", err);
        showAppToast("Ad unavailable right now.");
        if (typeof onDismiss === "function") onDismiss();
      });

      await AdMob.prepareRewardVideoAd({ adId: targetUnit });
      await AdMob.showRewardVideoAd();
      return;
    } catch (err) {
      isAdDisplayingActive = false;
      console.warn("Native AdMob error:", err);
      showAppToast("Ad unavailable right now.");
      if (typeof onDismiss === "function") onDismiss();
      return;
    }
  }

  if (typeof onReward === "function") onReward();
}

export function checkAndShowTransitionInterstitial() {
  const config = getAdmobConfig();
  if (!config.enabled) return Promise.resolve();

  episodesWatchedCount++;
  if (episodesWatchedCount % (config.interstitial_frequency || 3) === 0) {
    return showInterstitial({ placement: "episode_transition" });
  }
  return Promise.resolve();
}

export function showInterstitial({ placement = "transition", onClosed } = {}) {
  const config = getAdmobConfig();
  if (!config.enabled) {
    if (typeof onClosed === "function") onClosed();
    return Promise.resolve();
  }

  pauseActiveVideo();

  if (Capacitor.isNativePlatform()) {
    return new Promise(async (resolve) => {
      try {
        await initNativeAdMobSDK();
        isAdDisplayingActive = true;
        const targetUnit = config.test_mode ? GOOGLE_DEMO_INTERSTITIAL_UNIT : config.interstitial_unit;

        const dismissListener = await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
          dismissListener.remove();
          isAdDisplayingActive = false;
          setTimeout(() => {
            if (typeof onClosed === "function") onClosed();
            resolve();
          }, 250);
        });

        const failListener = await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => {
          failListener.remove();
          dismissListener.remove();
          isAdDisplayingActive = false;
          if (typeof onClosed === "function") onClosed();
          resolve();
        });

        await AdMob.prepareInterstitial({ adId: targetUnit });
        await AdMob.showInterstitial();
      } catch (e) {
        isAdDisplayingActive = false;
        console.warn("Native interstitial notice:", e);
        if (typeof onClosed === "function") onClosed();
        resolve();
      }
    });
  }

  if (typeof onClosed === "function") onClosed();
  return Promise.resolve();
}

export async function saveAdmobConfig(newConfig) {
  cachedConfig = { ...cachedConfig, ...newConfig, updated_at: new Date().toISOString() };
  localStorage.setItem("minsplay_admob_config", JSON.stringify(cachedConfig));
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/admob_config`, {
      method: "POST",
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(cachedConfig)
    });
    return true;
  } catch (err) {
    console.error("Save AdMob config failed:", err);
    return false;
  }
}
