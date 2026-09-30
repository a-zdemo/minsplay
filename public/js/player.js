import { saveProgress, getSeriesProgress, isEpisodeUnlocked, unlockEpisode, getUserCoins, spendCoins } from "./storage.js";
import { getSeriesById } from "./series-data.js";
import { showAppToast } from "./router.js";

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

  const video = document.getElementById("minsplay-video");
  const gestureSurface = document.getElementById("gesture-surface");
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
  const drawerSheet = document.getElementById("drawer-sheet");
  const drawerGrid = document.getElementById("drawer-episode-grid");
  const openDrawerBtn = document.getElementById("btn-open-drawer");
  const closeDrawerBtn = document.getElementById("drawer-close-btn");
  const lockOpenDrawerBtn = document.getElementById("btn-lock-open-drawer");
  const drawerLabel = document.getElementById("episodes-drawer-label");

  const likeBtn = document.getElementById("btn-action-like");
  const likeCounter = document.getElementById("like-counter");
  const favBtn = document.getElementById("btn-action-fav");
  const favLabel = document.getElementById("fav-label");
  const shareBtn = document.getElementById("btn-action-share");
  const soundBtn = document.getElementById("btn-sound-toggle");
  const fullscreenBtn = document.getElementById("btn-fullscreen-toggle");

  if (!video) return;

  if (backBtn) {
    backBtn.setAttribute("data-route", "/series");
    backBtn.setAttribute("data-series", currentSeries.id);
  }

  // Sync series title in both top HUD and bottom HUD
  document.querySelectorAll(".hud-series-title").forEach((el) => {
    el.textContent = currentSeries.shortTitle || currentSeries.title;
  });

  const drawerHeading = document.querySelector(".drawer-heading");
  const drawerSubheading = document.querySelector(".drawer-subheading");
  if (drawerHeading) drawerHeading.textContent = currentSeries.shortTitle || currentSeries.title;
  if (drawerSubheading) drawerSubheading.textContent = `Select Episode (${currentEpisodes.length} Episodes Total)`;
  if (drawerLabel) drawerLabel.textContent = `${currentEpisodes.length} Eps`;

  const hudGenreTags = document.querySelector(".hud-genre-tags");
  if (hudGenreTags) hudGenreTags.textContent = currentSeries.tags;

  function showStatus(msg) {
    if (!statusPill) return;
    statusPill.textContent = msg;
    statusPill.style.display = msg ? "block" : "none";
  }

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
      return `
        <button class="drawer-ep-card ${isActive ? 'active' : ''} ${!unlocked ? 'locked' : ''}" data-drawer-ep="${idx + 1}" type="button">
          <div class="drawer-ep-header">
            <span class="drawer-ep-num">EP ${ep.id}</span>
            <span class="drawer-ep-badge ${unlocked ? 'badge-free' : 'badge-locked'}">
              ${unlocked ? (ep.isFree ? 'FREE' : 'UNLOCKED') : '🔒 LOCK'}
            </span>
          </div>
          <span class="drawer-ep-name">${ep.title}</span>
        </button>
      `;
    }).join("");
  }

  function openDrawer() {
    renderDrawerGrid();
    if (drawerBackdrop) drawerBackdrop.classList.add("open");
    if (drawerSheet) drawerSheet.classList.add("open");
  }

  function closeDrawer() {
    if (drawerBackdrop) drawerBackdrop.classList.remove("open");
    if (drawerSheet) drawerSheet.classList.remove("open");
  }

  function syncCoinBalanceInModal() {
    if (lockModalCoinBalance) lockModalCoinBalance.textContent = `${getUserCoins()} Avail`;
  }

  function loadEpisode(index) {
    currentEpisodeIndex = Math.max(0, Math.min(index, currentEpisodes.length - 1));
    const ep = currentEpisodes[currentEpisodeIndex];
    if (!ep) return;

    const unlocked = isEpisodeUnlocked(currentSeries.id, ep.id, ep.isFree);

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
    showStatus("Buffering stream...");

    video.src = ep.src;
    video.load();

    const saved = getSeriesProgress(currentSeries.id);
    if (saved && saved.episodeId === ep.id && saved.position > 1) {
      video.currentTime = saved.position;
    }

    video.play().then(() => {
      if (playIndicator) playIndicator.classList.remove("active");
      showHUD();
    }).catch(() => {
      if (playIndicator) playIndicator.classList.add("active");
      showHUD();
    });
  }

  // =========================================================================
  // Vertical Swipe-to-Play-Next Gesture Engine (TikTok / DramaBox Pattern)
  // =========================================================================
  let touchStartY = 0;
  let touchStartX = 0;
  let touchStartTime = 0;

  if (gestureSurface) {
    gestureSurface.addEventListener("touchstart", (e) => {
      if (!e.touches || e.touches.length === 0) return;
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      touchStartTime = Date.now();
    }, { passive: true });

    // CRITICAL: Prevent Chrome on Android from canceling vertical swipe gestures
    gestureSurface.addEventListener("touchmove", (e) => {
      if (e.cancelable) e.preventDefault();
    }, { passive: false });

    gestureSurface.addEventListener("touchend", (e) => {
      if (!e.changedTouches || e.changedTouches.length === 0) return;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      const diffY = touchStartY - touchEndY;
      const diffX = touchStartX - touchEndX;
      const duration = Date.now() - touchStartTime;

      // 1. Vertical Swipe Detected (diffY > 40px means swiped UP)
      if (Math.abs(diffY) > 40 && Math.abs(diffY) > Math.abs(diffX) * 1.1) {
        if (diffY > 0) {
          // Swipe UP -> Next Episode
          if (currentEpisodeIndex < currentEpisodes.length - 1) {
            showAppToast(`▶ Next: Episode ${currentEpisodes[currentEpisodeIndex + 1].id}`);
            loadEpisode(currentEpisodeIndex + 1);
          } else {
            showAppToast("🎬 You've reached the latest episode!");
          }
        } else {
          // Swipe DOWN -> Previous Episode
          if (currentEpisodeIndex > 0) {
            showAppToast(`◀ Previous: Episode ${currentEpisodes[currentEpisodeIndex - 1].id}`);
            loadEpisode(currentEpisodeIndex - 1);
          } else {
            showAppToast("🎬 This is the first episode!");
          }
        }
        return;
      }

      // 2. Short Tap -> Toggle Play / Pause and HUD
      if (duration < 350 && Math.abs(diffY) < 15 && Math.abs(diffX) < 15) {
        handleTapToggle();
      }
    }, { passive: true });

    // Desktop mouse wheel scroll support
    let wheelDebounce = false;
    gestureSurface.addEventListener("wheel", (e) => {
      if (wheelDebounce) return;
      if (Math.abs(e.deltaY) > 40) {
        wheelDebounce = true;
        setTimeout(() => { wheelDebounce = false; }, 600);
        if (e.deltaY > 0 && currentEpisodeIndex < currentEpisodes.length - 1) {
          showAppToast(`▶ Next: Episode ${currentEpisodes[currentEpisodeIndex + 1].id}`);
          loadEpisode(currentEpisodeIndex + 1);
        } else if (e.deltaY < 0 && currentEpisodeIndex > 0) {
          showAppToast(`◀ Previous: Episode ${currentEpisodes[currentEpisodeIndex - 1].id}`);
          loadEpisode(currentEpisodeIndex - 1);
        }
      }
    }, { passive: true });
  }

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
  if (drawerBackdrop) drawerBackdrop.onclick = closeDrawer;
  if (lockOpenDrawerBtn) lockOpenDrawerBtn.onclick = () => openDrawer();

  if (drawerGrid) {
    drawerGrid.onclick = (e) => {
      const card = e.target.closest("[data-drawer-ep]");
      if (card) {
        const epNum = parseInt(card.getAttribute("data-drawer-ep"), 10);
        loadEpisode(epNum - 1);
      }
    };
  }

  const startIdx = Math.max(0, Math.min(initialEp - 1, currentEpisodes.length - 1));
  loadEpisode(startIdx);
}
