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
import { isEpisodeDownloaded, downloadEpisode, getCachedVideoBlobUrl } from "./downloader.js";
import { preloadNextEpisode, resolveStreamSource } from "./preloader.js";

const SPEED_LEVELS = [1.0, 1.25, 1.5, 2.0];
let currentSpeed = parseFloat(localStorage.getItem("minsplay_playback_speed") || "1.0");

let currentSeries = null;
let currentEpisodes = [];
let currentEpisodeIndex = 0;
let hudTimer = null;
let isLiked = false;
let isFavorited = false;
let likeCount = 14200;
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
  currentEpisodes = currentSeries.episodes || [];

  const playerRoot = document.getElementById("watch-page-root");
  const video = document.getElementById("minsplay-video");
  const playIndicator = document.getElementById("center-play-indicator");
  const lockModal = document.getElementById("watch-lock-modal");
  const lockedEpNum = document.getElementById("locked-ep-number");
  const unlockBtn = document.getElementById("btn-unlock-mock");
  const unlockCoinsBtn = document.getElementById("btn-unlock-coins");
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
  const lockOpenDrawerBtn = document.getElementById("btn-lock-open-drawer");
  const drawerLabel = document.getElementById("episodes-drawer-label");

  const speedBtn = document.getElementById("btn-speed-toggle");
  const likeBtn = document.getElementById("btn-action-like");
  const likeCounter = document.getElementById("like-counter");
  const favBtn = document.getElementById("btn-action-fav");
  const favLabel = document.getElementById("fav-label");
  const shareBtn = document.getElementById("btn-action-share");
  const soundBtn = document.getElementById("btn-sound-toggle");

  if (!video) return;

  if (backBtn) {
    backBtn.setAttribute("data-route", "/series");
    backBtn.setAttribute("data-series", currentSeries.id);
  }

  const seriesName = currentSeries.shortTitle || currentSeries.title;
  document.querySelectorAll(".hud-series-title").forEach((el) => {
    el.textContent = seriesName;
  });

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
    [hudTop, hudRight, hudBottom].forEach((el) => {
      if (el) el.classList.remove("hud-hidden");
    });
    clearTimeout(hudTimer);
    if (!video.paused) {
      hudTimer = setTimeout(() => {
        if (!video.paused) {
          [hudTop, hudRight, hudBottom].forEach((el) => {
            if (el) el.classList.add("hud-hidden");
          });
        }
      }, 3000);
    }
  }

  function hideHUD() {
    clearTimeout(hudTimer);
    [hudTop, hudRight, hudBottom].forEach((el) => {
      if (el) el.classList.add("hud-hidden");
    });
  }

  function renderDrawerGrid() {
    if (!drawerGrid) return;
    drawerGrid.innerHTML = currentEpisodes.map((ep, idx) => {
      const unlocked = isEpisodeUnlocked(currentSeries.id, ep.id, ep.isFree);
      const isActive = idx === currentEpisodeIndex;
      const downloaded = isEpisodeDownloaded(currentSeries.id, ep.id);

      let dlLabel = "Download";
      let dlClass = "";
      if (!unlocked) {
        dlLabel = "Locked";
        dlClass = "disabled";
      } else if (downloaded) {
        dlLabel = "Saved";
        dlClass = "downloaded";
      }

      return `
        <div class="drawer-ep-card-wrap">
          <button class="drawer-ep-card ${isActive ? 'active' : ''} ${!unlocked ? 'locked' : ''}" data-drawer-ep="${idx + 1}" type="button">
            <span class="drawer-ep-num">EP ${ep.id}</span>
            <span class="drawer-ep-name">${ep.title}</span>
            <span class="drawer-ep-badge ${unlocked ? 'badge-free' : 'badge-locked'}">
              ${unlocked ? (ep.isFree ? 'FREE' : 'UNLOCKED') : 'LOCK'}
            </span>
          </button>
          <button class="drawer-dl-btn ${dlClass}" data-dl-ep="${ep.id}" type="button" aria-label="Download Ep ${ep.id}">
            <span class="dl-btn-label">${dlLabel}</span>
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

  function syncCoinBalanceInModal() {
    if (lockModalCoinBalance) lockModalCoinBalance.textContent = `${getUserCoins()} Avail`;
  }

  async function loadEpisode(index) {
    currentEpisodeIndex = Math.max(0, Math.min(index, currentEpisodes.length - 1));
    const ep = currentEpisodes[currentEpisodeIndex];
    if (!ep) return;

    preloadTriggeredForEpisode = -1;
    const unlocked = isEpisodeUnlocked(currentSeries.id, ep.id, ep.isFree);

    const seriesName = currentSeries.shortTitle || currentSeries.title;
    document.querySelectorAll(".hud-series-title").forEach((el) => {
      el.textContent = seriesName;
    });
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
      syncCoinBalanceInModal();
      if (lockModal) lockModal.style.display = "flex";
      return;
    }

    if (lockModal) lockModal.style.display = "none";
    if (adModal) adModal.style.display = "none";

    // Instant Playback: Check offline cache, preloaded stream, or direct URL
    let streamUrl = ep.src;
    if (isEpisodeDownloaded(currentSeries.id, ep.id)) {
      const cachedBlob = await getCachedVideoBlobUrl(ep.src);
      if (cachedBlob) streamUrl = cachedBlob;
    } else {
      streamUrl = await resolveStreamSource(ep.src);
    }

    video.src = streamUrl;
    startPlaybackStream(ep);
  }

  function startPlaybackStream(ep) {
    video.load();
    video.playbackRate = currentSpeed;

    const saved = getSeriesProgress(currentSeries.id);
    if (saved && saved.episodeId === ep.id && saved.position > 1) {
      video.currentTime = saved.position;
    }

    video.play().then(() => {
      video.playbackRate = currentSpeed;
      if (playIndicator) playIndicator.classList.remove("active");
      showHUD();
    }).catch(() => {
      if (playIndicator) playIndicator.classList.add("active");
      showHUD();
    });
  }

  // Preloading Trigger in ontimeupdate (Activates at t >= 2s)
  let lastSavedSec = 0;
  video.ontimeupdate = () => {
    const cur = video.currentTime || 0;
    const dur = video.duration || 0;

    if (seekSlider && dur > 0 && !seekSlider.matches(":active")) {
      seekSlider.value = (cur / dur) * 100;
    }
    if (timeCurrent) timeCurrent.textContent = formatTime(cur);
    if (timeDuration) timeDuration.textContent = formatTime(dur);

    // Save watch progress
    const curSec = Math.floor(cur);
    if (curSec > 0 && curSec !== lastSavedSec && curSec % 2 === 0) {
      lastSavedSec = curSec;
      const ep = currentEpisodes[currentEpisodeIndex];
      saveProgress(currentSeries.id, ep.id, cur, dur, currentSeries.shortTitle || currentSeries.title);
    }

    // DramaBox Sliding Window Trigger: Preload Next Episode once current plays for 2s
    if (cur >= 2 && preloadTriggeredForEpisode !== currentEpisodeIndex) {
      preloadTriggeredForEpisode = currentEpisodeIndex;
      const nextEpIndex = currentEpisodeIndex + 1;
      if (nextEpIndex < currentEpisodes.length) {
        preloadNextEpisode(currentSeries.id, currentEpisodes[nextEpIndex]);
      }
    }
  };

  // Automated Binge & Auto-Advance
  video.onended = () => handleEpisodeEnded();

  function handleEpisodeEnded() {
    const settings = getUserSettings();
    if (settings.autoplayNext === false) {
      if (playIndicator) playIndicator.classList.add("active");
      showHUD();
      return;
    }

    if (currentEpisodeIndex >= currentEpisodes.length - 1) {
      showAppToast("🎬 Series Completed! Great binge.");
      if (playIndicator) playIndicator.classList.add("active");
      showHUD();
      return;
    }

    const nextIndex = currentEpisodeIndex + 1;
    const nextEp = currentEpisodes[nextIndex];
    const isNextUnlocked = isEpisodeUnlocked(currentSeries.id, nextEp.id, nextEp.isFree);

    if (isNextUnlocked) {
      loadEpisode(nextIndex);
    } else {
      const userCoins = getUserCoins();
      if (settings.autoUnlockNext !== false && userCoins >= 30) {
        spendCoins(30);
        unlockEpisode(currentSeries.id, nextEp.id);
        showAppToast(`🪙 Auto-unlocked Ep ${nextEp.id} (-30 Coins)`);
        setTimeout(() => loadEpisode(nextIndex), 400);
      } else {
        loadEpisode(nextIndex);
      }
    }
  }

  // Swipe Gestures
  let touchStartY = 0, touchStartX = 0, touchStartTime = 0;
  const targetSurface = playerRoot || document;

  targetSurface.addEventListener("touchstart", (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    touchStartTime = Date.now();
  }, { passive: true });

  targetSurface.addEventListener("touchend", (e) => {
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const diffY = touchStartY - e.changedTouches[0].clientY;
    const diffX = touchStartX - e.changedTouches[0].clientX;
    const duration = Date.now() - touchStartTime;

    if (e.target.closest("button, input, .drawer-sheet-box, .subtitles-sheet, .lock-modal-dialog")) return;

    if (Math.abs(diffY) > 40 && Math.abs(diffY) > Math.abs(diffX) * 1.1) {
      if (diffY > 0 && currentEpisodeIndex < currentEpisodes.length - 1) {
        loadEpisode(currentEpisodeIndex + 1);
      } else if (diffY < 0 && currentEpisodeIndex > 0) {
        loadEpisode(currentEpisodeIndex - 1);
      }
      return;
    }

    if (duration < 300 && Math.abs(diffY) < 12 && Math.abs(diffX) < 12) {
      if (video.paused) {
        video.play().then(() => playIndicator?.classList.remove("active"));
      } else {
        video.pause();
        playIndicator?.classList.add("active");
      }
      showHUD();
    }
  }, { passive: true });

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

  if (openDrawerBtn) openDrawerBtn.onclick = (e) => { e.stopPropagation(); openDrawer(); };
  if (closeDrawerBtn) closeDrawerBtn.onclick = closeDrawer;
  if (drawerBackdrop) drawerBackdrop.onclick = (e) => { if (e.target === drawerBackdrop) closeDrawer(); };
  if (lockOpenDrawerBtn) lockOpenDrawerBtn.onclick = () => openDrawer();

  const startIdx = Math.max(0, Math.min(initialEp - 1, currentEpisodes.length - 1));
  loadEpisode(startIdx);
}
