const SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDY4MjEsImV4cCI6MjEwNjM4MjgyMX0.26Lu_-rQX17LKXOSJ98d2OPRYIkfW_7S-8WaMsxqqeg";

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
let isAdmobInitialized = false;
let episodesWatchedCount = 0;

export async function initNativeAdMobSDK() {
  if (isAdmobInitialized) return;
  try {
    if (window.Capacitor?.Plugins?.AdMob) {
      await window.Capacitor.Plugins.AdMob.initialize({
        testingDevices: [],
        initializeForTesting: true
      });
      isAdmobInitialized = true;
      console.log("✓ Native Google Mobile Ads SDK initialized");
    }
  } catch (e) {
    console.warn("Native AdMob init notice:", e);
  }
}

// Auto-initialize on boot
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

fetchAdmobConfig();

export async function showRewardedVideo({ placement = "episode_unlock", onReward, onDismiss }) {
  const config = getAdmobConfig();
  if (!config.enabled) {
    if (typeof onReward === "function") onReward();
    return;
  }

  await initNativeAdMobSDK();

  // 1. Try Native AdMob Plugin
  if (window.Capacitor?.Plugins?.AdMob) {
    try {
      // Use official Google demo ID when test_mode is active or for initial QA
      const targetUnit = config.test_mode
        ? "ca-app-pub-3940256099942544/5224354917"
        : (placement === "rewards_loop" ? config.rewarded_task_unit : config.rewarded_unlock_unit);

      await window.Capacitor.Plugins.AdMob.prepareRewardVideoAd({ adId: targetUnit });
      const res = await window.Capacitor.Plugins.AdMob.showRewardVideoAd();
      if (res && typeof onReward === "function") {
        onReward();
        return;
      }
    } catch (err) {
      console.warn("Native AdMob ad request returned no fill / error. Using QA fallback dialog:", err);
    }
  }

  // 2. Fallback Verification Modal (Never leave episode locked if AdMob has no fill)
  presentAdmobTestDialog({
    type: "Rewarded Video Ad",
    unitId: config.test_mode ? "ca-app-pub-3940256099942544/5224354917" : config.rewarded_unlock_unit,
    testMode: config.test_mode,
    onComplete: onReward,
    onCancel: onDismiss
  });
}

export async function checkAndShowTransitionInterstitial() {
  const config = getAdmobConfig();
  if (!config.enabled) return;

  episodesWatchedCount++;
  if (episodesWatchedCount % (config.interstitial_frequency || 3) === 0) {
    showInterstitial({ placement: "episode_transition" });
  }
}

export async function showInterstitial({ placement = "transition", onClosed } = {}) {
  const config = getAdmobConfig();
  if (!config.enabled) {
    if (typeof onClosed === "function") onClosed();
    return;
  }

  await initNativeAdMobSDK();

  if (window.Capacitor?.Plugins?.AdMob) {
    try {
      const targetUnit = config.test_mode
        ? "ca-app-pub-3940256099942544/1033173712"
        : config.interstitial_unit;

      await window.Capacitor.Plugins.AdMob.prepareInterstitial({ adId: targetUnit });
      await window.Capacitor.Plugins.AdMob.showInterstitial();
      if (typeof onClosed === "function") {
        onClosed();
        return;
      }
    } catch (e) {
      console.warn("Native interstitial no fill:", e);
    }
  }

  presentAdmobTestDialog({
    type: "Interstitial Ad",
    unitId: config.test_mode ? "ca-app-pub-3940256099942544/1033173712" : config.interstitial_unit,
    testMode: config.test_mode,
    onComplete: onClosed,
    onCancel: onClosed
  });
}

function presentAdmobTestDialog({ type, unitId, testMode, onComplete, onCancel }) {
  const existing = document.getElementById("admob-runtime-dialog");
  if (existing) existing.remove();

  const overlay = document.createElement("aside");
  overlay.id = "admob-runtime-dialog";
  overlay.className = "admob-runtime-overlay";
  overlay.innerHTML = `
    <div class="admob-dialog-box">
      <div class="admob-dialog-header">
        <span class="admob-google-badge">${testMode ? "GOOGLE ADMOB • TEST MODE" : "GOOGLE ADMOB"}</span>
        <button type="button" class="admob-close-icon" id="admob-btn-cancel">✕</button>
      </div>
      <div class="admob-dialog-body">
        <div class="admob-icon-cluster">📢</div>
        <h3 class="admob-dialog-title">${type}</h3>
        <p class="admob-unit-label">Ad Unit ID:</p>
        <code class="admob-unit-code">${unitId || 'ca-app-pub-6215013187981045/9023250919'}</code>
        <div class="admob-countdown-bar" id="admob-load-bar"><div class="admob-countdown-fill"></div></div>
      </div>
      <div class="admob-dialog-actions">
        <button type="button" class="btn-admob-grant" id="admob-btn-grant">Simulate Ad Completion ✓</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const grantBtn = document.getElementById("admob-btn-grant");
  const cancelBtn = document.getElementById("admob-btn-cancel");

  if (grantBtn) {
    grantBtn.onclick = () => {
      overlay.remove();
      if (typeof onComplete === "function") onComplete();
    };
  }

  if (cancelBtn) {
    cancelBtn.onclick = () => {
      overlay.remove();
      if (typeof onCancel === "function") onCancel();
    };
  }
}
