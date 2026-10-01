import {
  saveProgress,
  getSeriesProgress,
  isEpisodeUnlocked,
  unlockEpisode,
  getUserCoins,
  spendCoins,
  getUserSettings
} from "./storage.js";
import { getSeriesById } from "./series-data.js";
import { showAppToast } from "./router.js";
import { isEpisodeDownloaded, getCachedVideoBlobUrl } from "./downloader.js";
import { preloadNextEpisode, resolveStreamSource } from "./preloader.js";

const SPEED_LEVELS = [1.0, 1.25, 1.5, 2.0];
let currentSpeed = parseFloat(localStorage.getItem("minsplay_playback_speed") || "1.0");

let currentSeries = null;
let currentEpisodes = [];
let currentEpisodeIndex = 0;
let hudTimer = null;
let preloadTriggeredForEpisode = -1;

let adTimerInterval = null;
let adProgressInterval = null;

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function initPlayer(seriesId = "the-dark-bees", initialEp = 1) {
  currentSeries = getSeriesById(seriesId) || getSeriesById();
  currentEpisodes = (currentSeries && currentSeries.episodes) || [];

  const playerRoot = document.getElementById("watch-page-root");
  const video = document.getElementById("minsplay-video");
  const playIndicator = document.getElementById("center-play-indicator");
  const lockModal = document.getElementById("watch-lock-modal");
  const lockedEpNum = document.getElementById("locked-ep-number");
  const unlockCoinsBtn = document.getElementById("btn-unlock-coins");
  const unlockAdBtn = document.getElementById("btn-unlock-mock");
  const lockOpenDrawerBtn = document.getElementById("btn-lock-open-drawer");
  const lockModalCoinBalance = document.getElementById("lock-modal-coin-balance");
  const statusPill = document.getElementById("hud-status-pill");

  const adModal = document.getElementById("rewarded-ad-modal");
  const adTimerPill = document.getElementById("ad-timer-pill");
  const adSkipBtn = document.getElementById("ad-skip-btn");
  const adProgressFill = document.getElementById("ad-progress-fill");
  const adRewardSplash = document.getElementById("ad-reward-splash");

  const hudTop = document.getElementById("hud-top");
  const hudRight = document.getElementById("hud-right");
  const hudBottom = document.getElementById("hud-bottom");
  const backBtn = document.getElementById("watch-back-btn");

  const epBadge = document.getElementById("watch-ep-badge");
  const epTitle = document.getElementById("watch-current-title");
  const seekSlider = document.getElementById("video-seek");
  const timeCurrent = document.getElementById("hud-time-current");
  const timeDuration = document.getElementById("hud-time-duration");

  const drawerBackdrop = document.getElementById("drawer-backdrop");
  const drawerGrid = document.getElementById("drawer-episode-grid");
  const openDrawerBtn = document.getElementById("btn-open-drawer");
  const closeDrawerBtn = document.getElementById("drawer-close-btn");
  const speedBtn = document.getElementById("btn-speed-toggle");
  const soundBtn = document.getElementById("btn-sound-toggle");

  if (!video) return;

  if (backBtn && currentSeries) {
    backBtn.setAttribute("data-route", "/series");
    backBtn.setAttribute("data-series", currentSeries.id);
  }

  const seriesName = currentSeries ? (currentSeries.shortTitle || currentSeries.title) : "Drama Series";
  document.querySelectorAll(".hud-series-title").forEach((el) => {
    el.textContent = seriesName;
  });

  const drawerLabel = document.getElementById("episodes-drawer-label");
  if (drawerLabel) drawerLabel.textContent = `${currentEpisodes.length} Eps`;

  function showStatus(msg) {
    if (!statusPill) return;
    statusPill.textContent = msg;
    statusPill.style.display = msg ? "block" : "none";
  }

  function syncSpeedButton() {
    if (!speedBtn) return;
    speedBtn.textContent = `${currentSpeed}x`;
    speedBtn.classList.toggle("boosted", currentSpeed > 1.0);
  }
  syncSpeedButton();

  function showHUD() {
    [hudTop, hudRight, hudBottom].forEach((el) => el && el.classList.remove("hud-hidden"));
    clearTimeout(hudTimer);
    if (!video.paused) {
      hudTimer = setTimeout(() => {
        if (!video.paused) {
          [hudTop, hudRight, hudBottom].forEach((el) => el && el.classList.add("hud-hidden"));
        }
      }, 3500);
    }
  }

  function hideHUD() {
    clearTimeout(hudTimer);
    [hudTop, hudRight, hudBottom].forEach((el) => el && el.classList.add("hud-hidden"));
  }

  function renderDrawerGrid() {
    if (!drawerGrid || !currentSeries) return;
    drawerGrid.innerHTML = currentEpisodes.map((ep, idx) => {
      const unlocked = isEpisodeUnlocked(currentSeries.id, ep.id, ep.isFree);
      const isActive = idx === currentEpisodeIndex;

      return `
        <div class="drawer-ep-card-wrap">
          <button class="drawer-ep-card ${isActive ? 'active' : ''} ${!unlocked ? 'locked' : ''}" data-drawer-ep="${idx + 1}" type="button">
            <span class="drawer-ep-num">EP ${ep.id}</span>
            <span class="drawer-ep-name">${ep.title}</span>
            <span class="drawer-ep-badge ${unlocked ? 'badge-free' : 'badge-locked'}">
              ${unlocked ? (ep.isFree ? 'FREE' : 'UNLOCKED') : 'LOCK'}
            </span>
          </button>
        </div>
      `;
    }).join("");
  }
  function openDrawer() {
    renderDrawerGrid();
    if (drawerBackdrop) drawerBackdrop.style.display = "flex";
  }

  function closeDrawer() {
    if (drawerBackdrop) drawerBackdrop.style.display = "none";
  }

  async function loadEpisode(index) {
    currentEpisodeIndex = Math.max(0, Math.min(index, currentEpisodes.length - 1));
    const ep = currentEpisodes[currentEpisodeIndex];
    if (!ep || !currentSeries) return;

    preloadTriggeredForEpisode = -1;
    const unlocked = isEpisodeUnlocked(currentSeries.id, ep.id, ep.isFree);

    const seriesName = currentSeries.shortTitle || currentSeries.title;
    document.querySelectorAll(".hud-series-title").forEach((el) => el.textContent = seriesName);
    if (epBadge) epBadge.textContent = `Ep ${ep.id}`;
    if (epTitle) epTitle.textContent = ep.title;
    if (lockedEpNum) lockedEpNum.textContent = `${ep.id}`;

    closeDrawer();

    if (!unlocked) {
      video.pause();
      video.removeAttribute("src");
      video.load();
      if (playIndicator) playIndicator.classList.remove("active");
      hideHUD();
      showStatus("");
      if (lockModalCoinBalance) lockModalCoinBalance.textContent = `${getUserCoins()} Avail`;
      if (lockModal) lockModal.style.display = "flex";
      return;
    }

    if (lockModal) lockModal.style.display = "none";
    if (adModal) adModal.style.display = "none";
    showStatus("Connecting media stream...");

    let streamUrl = ep.src;
    if (isEpisodeDownloaded(currentSeries.id, ep.id)) {
      const cachedBlob = await getCachedVideoBlobUrl(ep.src);
      if (cachedBlob) streamUrl = cachedBlob;
    } else {
      streamUrl = await resolveStreamSource(ep.src);
    }

    video.src = streamUrl;
    video.load();
    video.playbackRate = currentSpeed;

    const saved = getSeriesProgress(currentSeries.id);
    if (saved && saved.episodeId === ep.id && saved.position > 1) {
      video.currentTime = saved.position;
    }

    video.play().then(() => {
      showStatus("");
      if (playIndicator) playIndicator.classList.remove("active");
      showHUD();
    }).catch(() => {
      showStatus("");
      if (playIndicator) playIndicator.classList.add("active");
      showHUD();
    });
  }

  // LOCK MODAL FIX: 1. Unlock by spending 30 coins
  if (unlockCoinsBtn) {
    unlockCoinsBtn.onclick = () => {
      const ep = currentEpisodes[currentEpisodeIndex];
      if (!ep || !currentSeries) return;
      const cost = 30;
      const coins = getUserCoins();
      if (coins >= cost) {
        spendCoins(cost);
        unlockEpisode(currentSeries.id, ep.id);
        showAppToast(`🪙 -30 Coins! Ep ${ep.id} Unlocked.`);
        loadEpisode(currentEpisodeIndex);
      } else {
        showAppToast(`Need ${cost} coins! Balance: ${coins} 🪙`);
      }
    };
  }

  // LOCK MODAL FIX: 2. Unlock by watching 5s rewarded ad
  function startRewardedAdFlow() {
    const ep = currentEpisodes[currentEpisodeIndex];
    if (!ep || !currentSeries || !adModal) return;

    if (lockModal) lockModal.style.display = "none";
    if (adRewardSplash) adRewardSplash.style.display = "none";
    adModal.style.display = "flex";

    if (adSkipBtn) {
      adSkipBtn.disabled = true;
      adSkipBtn.classList.add("disabled");
      adSkipBtn.textContent = "✕";
    }
    if (adProgressFill) adProgressFill.style.width = "0%";

    let remainingSeconds = 5;
    if (adTimerPill) adTimerPill.textContent = `Reward in ${remainingSeconds}s`;

    const totalDurationMs = 5000;
    const startTime = Date.now();

    clearInterval(adProgressInterval);
    adProgressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min(100, (elapsed / totalDurationMs) * 100);
      if (adProgressFill) adProgressFill.style.width = `${progressPercent}%`;
      if (elapsed >= totalDurationMs) clearInterval(adProgressInterval);
    }, 50);

    clearInterval(adTimerInterval);
    adTimerInterval = setInterval(() => {
      remainingSeconds -= 1;
      if (remainingSeconds > 0) {
        if (adTimerPill) adTimerPill.textContent = `Reward in ${remainingSeconds}s`;
      } else {
        clearInterval(adTimerInterval);
        clearInterval(adProgressInterval);
        if (adTimerPill) adTimerPill.textContent = "Reward Granted!";
        if (adProgressFill) adProgressFill.style.width = "100%";
        if (adSkipBtn) {
          adSkipBtn.disabled = false;
          adSkipBtn.classList.remove("disabled");
          adSkipBtn.textContent = "✓";
        }
        if (adRewardSplash) adRewardSplash.style.display = "flex";
        unlockEpisode(currentSeries.id, ep.id);
        setTimeout(() => {
          clearInterval(adTimerInterval);
          clearInterval(adProgressInterval);
          if (adModal) adModal.style.display = "none";
          showAppToast(`🎉 Episode ${ep.id} Unlocked!`);
          loadEpisode(currentEpisodeIndex);
        }, 1200);
      }
    }, 1000);
  }

  if (unlockAdBtn) unlockAdBtn.onclick = startRewardedAdFlow;

  if (adSkipBtn) {
    adSkipBtn.onclick = () => {
      if (!adSkipBtn.disabled) {
        clearInterval(adTimerInterval);
        clearInterval(adProgressInterval);
        if (adModal) adModal.style.display = "none";
        loadEpisode(currentEpisodeIndex);
      }
    };
  }

  // LOCK MODAL FIX: 3. Choose another episode from drawer
  if (lockOpenDrawerBtn) {
    lockOpenDrawerBtn.onclick = () => {
      openDrawer();
    };
  }

  // Drawer episode clicks
  if (drawerGrid) {
    drawerGrid.onclick = (e) => {
      const card = e.target.closest("[data-drawer-ep]");
      if (card) {
        const epNum = parseInt(card.getAttribute("data-drawer-ep"), 10);
        loadEpisode(epNum - 1);
      }
    };
  }

  // Auto-advance
  video.onended = () => {
    if (currentEpisodeIndex < currentEpisodes.length - 1) {
      showAppToast(`▶ Next: Episode ${currentEpisodes[currentEpisodeIndex + 1].id}`);
      loadEpisode(currentEpisodeIndex + 1);
    } else {
      showAppToast("🎬 Series Completed! Great binge.");
    }
  };

  // Touch Swipe Gestures
  let touchStartY = 0, touchStartX = 0;
  const targetSurface = playerRoot || document;

  targetSurface.addEventListener("touchstart", (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  targetSurface.addEventListener("touchend", (e) => {
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const diffY = touchStartY - e.changedTouches[0].clientY;
    const diffX = touchStartX - e.changedTouches[0].clientX;

    if (e.target.closest("button, input, select, .drawer-sheet-box, .auth-sheet, .lock-modal-dialog, .rewarded-ad-modal")) return;

    if (Math.abs(diffY) > 45 && Math.abs(diffY) > Math.abs(diffX) * 1.2) {
      if (diffY > 0 && currentEpisodeIndex < currentEpisodes.length - 1) {
        showAppToast(`▶ Next: Episode ${currentEpisodes[currentEpisodeIndex + 1].id}`);
        loadEpisode(currentEpisodeIndex + 1);
      } else if (diffY < 0 && currentEpisodeIndex > 0) {
        showAppToast(`◀ Previous: Episode ${currentEpisodes[currentEpisodeIndex - 1].id}`);
        loadEpisode(currentEpisodeIndex - 1);
      }
      return;
    }

    if (video.paused) {
      video.play().then(() => playIndicator?.classList.remove("active")).catch(() => {});
    } else {
      video.pause();
      playIndicator?.classList.add("active");
    }
    showHUD();
  }, { passive: true });

  video.onloadedmetadata = () => {
    showStatus("");
    if (timeDuration) timeDuration.textContent = formatTime(video.duration || 0);
  };

  video.ontimeupdate = () => {
    const cur = video.currentTime || 0;
    const dur = video.duration || 0;
    if (seekSlider && dur > 0 && !seekSlider.matches(":active")) {
      seekSlider.value = (cur / dur) * 100;
    }
    if (timeCurrent) timeCurrent.textContent = formatTime(cur);
    if (timeDuration) timeDuration.textContent = formatTime(dur);

    if (cur >= 2 && preloadTriggeredForEpisode !== currentEpisodeIndex) {
      preloadTriggeredForEpisode = currentEpisodeIndex;
      const nextIdx = currentEpisodeIndex + 1;
      if (nextIdx < currentEpisodes.length && currentSeries) {
        preloadNextEpisode(currentSeries.id, currentEpisodes[nextIdx]);
      }
    }
  };

  if (seekSlider) {
    seekSlider.oninput = () => {
      const dur = video.duration || 0;
      if (dur > 0) video.currentTime = (seekSlider.value / 100) * dur;
    };
  }

  if (speedBtn) {
    speedBtn.onclick = (e) => {
      e.stopPropagation();
      const nextIdx = (SPEED_LEVELS.indexOf(currentSpeed) + 1) % SPEED_LEVELS.length;
      currentSpeed = SPEED_LEVELS[nextIdx];
      localStorage.setItem("minsplay_playback_speed", currentSpeed.toString());
      if (video) video.playbackRate = currentSpeed;
      syncSpeedButton();
      showAppToast(`⚡ Speed: ${currentSpeed}x`);
    };
  }

  if (soundBtn) {
    soundBtn.onclick = (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
      soundBtn.textContent = video.muted ? "🔇" : "🔊";
      showAppToast(video.muted ? "Muted 🔇" : "Sound Unmuted 🔊");
    };
  }

  if (openDrawerBtn) openDrawerBtn.onclick = (e) => { e.stopPropagation(); openDrawer(); };
  if (closeDrawerBtn) closeDrawerBtn.onclick = closeDrawer;
  if (drawerBackdrop) drawerBackdrop.onclick = (e) => { if (e.target === drawerBackdrop) closeDrawer(); };

  const startIdx = Math.max(0, Math.min(initialEp - 1, currentEpisodes.length - 1));
  loadEpisode(startIdx);
}
