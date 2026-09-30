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
import {
  isEpisodeDownloaded,
  downloadEpisode,
  getCachedVideoBlobUrl
} from "./downloader.js";

const SPEED_LEVELS = [1.0, 1.25, 1.5, 2.0];
let currentSpeed = parseFloat(localStorage.getItem("minsplay_playback_speed") || "1.0");

let currentSeries = null;
let currentEpisodes = [];
let currentEpisodeIndex = 0;
let hudTimer = null;
let isLiked = false;
let isFavorited = false;
let likeCount = 14200;

let adTimerInterval = null;
let adProgressInterval = null;

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function initPlayer(seriesId = "the-beginning", initialEp = 1) {
  currentSeries = getSeriesById(seriesId);
  currentEpisodes = currentSeries.episodes;

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

  // Enhanced Episode Drawer Grid with High-Contrast Download Pills
  function renderDrawerGrid() {
    if (!drawerGrid) return;
    drawerGrid.innerHTML = currentEpisodes.map((ep, idx) => {
      const unlocked = isEpisodeUnlocked(currentSeries.id, ep.id, ep.isFree);
      const isActive = idx === currentEpisodeIndex;
      const downloaded = isEpisodeDownloaded(currentSeries.id, ep.id);

      let dlLabel = "⬇ Download";
      let dlClass = "";
      if (!unlocked) {
        dlLabel = "🔒 Locked";
        dlClass = "disabled";
      } else if (downloaded) {
        dlLabel = "✓ Saved";
        dlClass = "downloaded";
      }

      return `
        <div class="drawer-ep-card-wrap">
          <button class="drawer-ep-card ${isActive ? 'active' : ''} ${!unlocked ? 'locked' : ''}" data-drawer-ep="${idx + 1}" type="button">
            <span class="drawer-ep-num">EP ${ep.id}</span>
            <span class="drawer-ep-name">${ep.title}</span>
            <span class="drawer-ep-badge ${unlocked ? 'badge-free' : 'badge-locked'}">
              ${unlocked ? (ep.isFree ? 'FREE' : 'UNLOCKED') : '🔒 LOCK'}
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
  // Offline Cache Video Playback Interception
  function loadEpisode(index) {
    currentEpisodeIndex = Math.max(0, Math.min(index, currentEpisodes.length - 1));
    const ep = currentEpisodes[currentEpisodeIndex];
    if (!ep) return;

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

    // Play from offline Cache API blob if downloaded
    if (isEpisodeDownloaded(currentSeries.id, ep.id)) {
      showStatus("Loading offline cache...");
      getCachedVideoBlobUrl(ep.src).then((blobUrl) => {
        if (blobUrl) {
          video.src = blobUrl;
          showAppToast(`⚡ Playing Ep ${ep.id} from offline storage`);
        } else {
          video.src = ep.src;
        }
        startPlaybackStream(ep);
      }).catch(() => {
        video.src = ep.src;
        startPlaybackStream(ep);
      });
    } else {
      showStatus("Buffering stream...");
      video.src = ep.src;
      startPlaybackStream(ep);
    }
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

  // Speed Selector Toggle
  if (speedBtn) {
    speedBtn.onclick = (e) => {
      e.stopPropagation();
      const currentIdx = SPEED_LEVELS.indexOf(currentSpeed);
      const nextIdx = (currentIdx + 1) % SPEED_LEVELS.length;
      currentSpeed = SPEED_LEVELS[nextIdx];
      localStorage.setItem("minsplay_playback_speed", currentSpeed.toString());

      if (video) video.playbackRate = currentSpeed;
      syncSpeedButton();
      showAppToast(`⚡ Speed: ${currentSpeed}x`);
      showHUD();
    };
  }

  // Automated Binge & Auto-Coin Unlock
  video.onended = () => {
    handleEpisodeEnded();
  };

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
      showAppToast(`▶ Auto-advancing to Episode ${nextEp.id}...`);
      setTimeout(() => loadEpisode(nextIndex), 500);
      return;
    }

    const autoUnlockEnabled = settings.autoUnlockNext !== false;
    const userCoins = getUserCoins();
    const unlockCost = 30;

    if (autoUnlockEnabled && userCoins >= unlockCost) {
      spendCoins(unlockCost);
      unlockEpisode(currentSeries.id, nextEp.id);
      showAppToast(`🪙 Auto-unlocked Ep ${nextEp.id} (-30 Coins)`);
      setTimeout(() => loadEpisode(nextIndex), 750);
    } else if (autoUnlockEnabled && userCoins < unlockCost) {
      showAppToast(`Ep ${nextEp.id} locked! Need ${unlockCost} coins.`);
      loadEpisode(nextIndex);
    } else {
      loadEpisode(nextIndex);
    }
  }

  // Drawer Download Click Handler with Live State Transitions
  if (drawerGrid) {
    drawerGrid.onclick = (e) => {
      const dlBtn = e.target.closest(".drawer-dl-btn");
      if (dlBtn) {
        e.stopPropagation();
        const epId = parseInt(dlBtn.getAttribute("data-dl-ep"), 10);
        const ep = currentEpisodes.find((x) => x.id === epId);
        if (!ep) return;

        const unlocked = isEpisodeUnlocked(currentSeries.id, ep.id, ep.isFree);
        if (!unlocked) {
          showAppToast(`🔒 Unlock Ep ${ep.id} first to download`);
          return;
        }

        if (isEpisodeDownloaded(currentSeries.id, ep.id)) {
          showAppToast(`✓ Episode ${ep.id} is already in offline storage`);
          return;
        }

        const label = dlBtn.querySelector(".dl-btn-label");
        if (label) label.textContent = "⏳ Saving...";
        dlBtn.classList.add("downloading");
        showAppToast(`⬇ Downloading Ep ${ep.id} for offline...`);

        downloadEpisode(currentSeries, ep).then((res) => {
          if (res.success) {
            if (label) label.textContent = "✓ Saved";
            dlBtn.classList.remove("downloading");
            dlBtn.classList.add("downloaded");
            showAppToast(`🎉 Ep ${ep.id} saved (${res.sizeStr})! Available offline.`);
          } else {
            if (label) label.textContent = "⬇ Download";
            dlBtn.classList.remove("downloading");
            showAppToast(`Download failed: ${res.error || "Network error"}`);
          }
        });
        return;
      }

      const card = e.target.closest("[data-drawer-ep]");
      if (card) {
        const epNum = parseInt(card.getAttribute("data-drawer-ep"), 10);
        loadEpisode(epNum - 1);
      }
    };
  }

  // Swipe Gestures
  let touchStartY = 0;
  let touchStartX = 0;
  let touchStartTime = 0;

  const targetSurface = playerRoot || document;

  targetSurface.addEventListener("touchstart", (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    touchStartTime = Date.now();
  }, { passive: true });

  targetSurface.addEventListener("touchend", (e) => {
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    const diffY = touchStartY - touchEndY;
    const diffX = touchStartX - touchEndX;
    const duration = Date.now() - touchStartTime;

    if (e.target.closest("button, input, .drawer-sheet-box, .subtitles-sheet, .lock-modal-dialog")) {
      return;
    }

    if (Math.abs(diffY) > 40 && Math.abs(diffY) > Math.abs(diffX) * 1.1) {
      if (diffY > 0) {
        if (currentEpisodeIndex < currentEpisodes.length - 1) {
          showAppToast(`▶ Next: Episode ${currentEpisodes[currentEpisodeIndex + 1].id}`);
          loadEpisode(currentEpisodeIndex + 1);
        } else {
          showAppToast("🎬 You've reached the latest episode!");
        }
      } else {
        if (currentEpisodeIndex > 0) {
          showAppToast(`◀ Previous: Episode ${currentEpisodes[currentEpisodeIndex - 1].id}`);
          loadEpisode(currentEpisodeIndex - 1);
        } else {
          showAppToast("🎬 This is the first episode!");
        }
      }
      return;
    }

    if (duration < 300 && Math.abs(diffY) < 12 && Math.abs(diffX) < 12) {
      handleTapToggle();
    }
  }, { passive: true });

  function handleTapToggle() {
    const isHudHidden = hudBottom && hudBottom.classList.contains("hud-hidden");
    if (isHudHidden) {
      showHUD();
    } else {
      if (video.paused) {
        video.play().then(() => {
          if (playIndicator) playIndicator.classList.remove("active");
          showHUD();
        });
      } else {
        video.pause();
        if (playIndicator) playIndicator.classList.add("active");
        showHUD();
      }
    }
  }

  if (unlockCoinsBtn) {
    unlockCoinsBtn.onclick = () => {
      const ep = currentEpisodes[currentEpisodeIndex];
      const unlockCost = 30;
      const currentCoins = getUserCoins();
      if (currentCoins >= unlockCost) {
        spendCoins(unlockCost);
        unlockEpisode(currentSeries.id, ep.id);
        showAppToast(`🪙 -30 Coins! Ep ${ep.id} Unlocked.`);
        loadEpisode(currentEpisodeIndex);
      } else {
        showAppToast(`Need ${unlockCost} coins! Balance: ${currentCoins} 🪙`);
      }
    };
  }

  function startRewardedAdFlow() {
    const ep = currentEpisodes[currentEpisodeIndex];
    if (!ep || !adModal) return;
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

  if (unlockBtn) unlockBtn.onclick = () => startRewardedAdFlow();
  if (adSkipBtn) {
    adSkipBtn.onclick = () => {
      if (!adSkipBtn.disabled) {
        const ep = currentEpisodes[currentEpisodeIndex];
        if (adModal) adModal.style.display = "none";
        showAppToast(`🎉 Episode ${ep.id} Unlocked!`);
        loadEpisode(currentEpisodeIndex);
      }
    };
  }

  video.oncanplay = () => showStatus("");
  video.onplaying = () => {
    showStatus("");
    if (playIndicator) playIndicator.classList.remove("active");
    showHUD();
  };
  video.onpause = () => {
    const ep = currentEpisodes[currentEpisodeIndex];
    if (isEpisodeUnlocked(currentSeries.id, ep.id, ep.isFree)) {
      if (playIndicator) playIndicator.classList.add("active");
      showHUD();
    }
  };
  video.onerror = () => {
    showStatus("Stream error loading video");
    if (playIndicator) playIndicator.classList.remove("active");
  };

  let lastSavedSec = 0;
  video.ontimeupdate = () => {
    const cur = video.currentTime || 0;
    const dur = video.duration || 0;
    if (seekSlider && dur > 0 && !seekSlider.matches(":active")) {
      seekSlider.value = (cur / dur) * 100;
    }
    if (timeCurrent) timeCurrent.textContent = formatTime(cur);
    if (timeDuration) timeDuration.textContent = formatTime(dur);
    const curSec = Math.floor(cur);
    if (curSec > 0 && curSec !== lastSavedSec && curSec % 2 === 0) {
      lastSavedSec = curSec;
      const ep = currentEpisodes[currentEpisodeIndex];
      saveProgress(currentSeries.id, ep.id, cur, dur, currentSeries.shortTitle || currentSeries.title);
    }
  };

  if (seekSlider) {
    seekSlider.oninput = () => {
      const dur = video.duration || 0;
      if (dur > 0) {
        video.currentTime = (seekSlider.value / 100) * dur;
        showHUD();
      }
    };
  }

  if (likeBtn) {
    likeBtn.onclick = (e) => {
      e.stopPropagation();
      isLiked = !isLiked;
      likeBtn.classList.toggle("active", isLiked);
      likeCount = isLiked ? likeCount + 1 : likeCount - 1;
      if (likeCounter) likeCounter.textContent = `${(likeCount / 1000).toFixed(1)}K`;
      showAppToast(isLiked ? "Added to Liked Videos ♥" : "Removed Like");
      showHUD();
    };
  }

  if (favBtn) {
    favBtn.onclick = (e) => {
      e.stopPropagation();
      isFavorited = !isFavorited;
      favBtn.classList.toggle("active", isFavorited);
      if (favLabel) favLabel.textContent = isFavorited ? "Saved ★" : "Collect";
      showAppToast(isFavorited ? "Saved to My List ★" : "Removed from My List");
      showHUD();
    };
  }

  if (shareBtn) {
    shareBtn.onclick = (e) => {
      e.stopPropagation();
      if (navigator.share) {
        navigator.share({ title: currentSeries.title, url: window.location.href }).catch(() => {});
      } else {
        showAppToast("Link copied to clipboard ↗");
      }
      showHUD();
    };
  }

  if (soundBtn) {
    soundBtn.onclick = (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
      soundBtn.textContent = video.muted ? "🔇" : "🔊";
      showAppToast(video.muted ? "Muted 🔇" : "Sound Unmuted 🔊");
      showHUD();
    };
  }

  if (openDrawerBtn) openDrawerBtn.onclick = (e) => { e.stopPropagation(); openDrawer(); };
  if (closeDrawerBtn) closeDrawerBtn.onclick = closeDrawer;
  if (drawerBackdrop) drawerBackdrop.onclick = (e) => { if (e.target === drawerBackdrop) closeDrawer(); };
  if (lockOpenDrawerBtn) lockOpenDrawerBtn.onclick = () => openDrawer();

  const startIdx = Math.max(0, Math.min(initialEp - 1, currentEpisodes.length - 1));
  loadEpisode(startIdx);
}
