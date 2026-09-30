import { saveProgress, getSeriesProgress, isEpisodeUnlocked, unlockEpisode } from "./storage.js";
import { getSeriesById } from "./series-data.js";

let currentSeries = null;
let currentEpisodes = [];
let currentEpisodeIndex = 0;
let hudTimer = null;
let isLiked = false;
let isFavorited = false;
let likeCount = 14200;

// Ad countdown timers
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
  const statusPill = document.getElementById("hud-status-pill");

  // Rewarded Ad Elements (Section 18)
  const adModal = document.getElementById("rewarded-ad-modal");
  const adTimerPill = document.getElementById("ad-timer-pill");
  const adSkipBtn = document.getElementById("ad-skip-btn");
  const adProgressFill = document.getElementById("ad-progress-fill");
  const adRewardSplash = document.getElementById("ad-reward-splash");

  // Floating HUD containers
  const hudTop = document.getElementById("hud-top");
  const hudRight = document.getElementById("hud-right");
  const hudBottom = document.getElementById("hud-bottom");
  const swipeHint = document.getElementById("hud-swipe-hint");
  const backBtn = document.getElementById("watch-back-btn");

  // Meta displays
  const epBadge = document.getElementById("watch-ep-badge");
  const epTitle = document.getElementById("watch-current-title");
  const seekSlider = document.getElementById("video-seek");
  const timeCurrent = document.getElementById("hud-time-current");
  const timeDuration = document.getElementById("hud-time-duration");

  // Drawer Elements
  const drawerBackdrop = document.getElementById("drawer-backdrop");
  const drawerSheet = document.getElementById("drawer-sheet");
  const drawerGrid = document.getElementById("drawer-episode-grid");
  const openDrawerBtn = document.getElementById("btn-open-drawer");
  const closeDrawerBtn = document.getElementById("drawer-close-btn");
  const lockOpenDrawerBtn = document.getElementById("btn-lock-open-drawer");
  const drawerLabel = document.getElementById("episodes-drawer-label");

  // Actions
  const likeBtn = document.getElementById("btn-action-like");
  const likeCounter = document.getElementById("like-counter");
  const favBtn = document.getElementById("btn-action-fav");
  const favLabel = document.getElementById("fav-label");
  const shareBtn = document.getElementById("btn-action-share");
  const soundBtn = document.getElementById("btn-sound-toggle");
  const fullscreenBtn = document.getElementById("btn-fullscreen-toggle");
  const toast = document.getElementById("watch-toast");

  if (!video) return;

  // Set Back Button to return to this specific drama's detail screen
  if (backBtn) {
    backBtn.setAttribute("data-route", "/series");
    backBtn.setAttribute("data-series", currentSeries.id);
  }

  // Update Top HUD Series Title
  const hudSeriesTitle = document.querySelector(".hud-series-title");
  if (hudSeriesTitle) {
    hudSeriesTitle.textContent = currentSeries.shortTitle || currentSeries.title;
  }

  // Update Drawer Subheading & Drawer Count
  const drawerHeading = document.querySelector(".drawer-heading");
  const drawerSubheading = document.querySelector(".drawer-subheading");
  if (drawerHeading) drawerHeading.textContent = currentSeries.shortTitle || currentSeries.title;
  if (drawerSubheading) drawerSubheading.textContent = `Select Episode (${currentEpisodes.length} Episodes Total)`;
  if (drawerLabel) drawerLabel.textContent = `${currentEpisodes.length} Eps`;

  // Update Genre Tags under Title
  const hudGenreTags = document.querySelector(".hud-genre-tags");
  if (hudGenreTags) {
    hudGenreTags.textContent = currentSeries.tags;
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    setTimeout(() => toast.classList.remove("visible"), 2200);
  }

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
          if (swipeHint) swipeHint.style.opacity = "0";
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
        <button
          class="drawer-ep-card ${isActive ? "active" : ""} ${!unlocked ? "locked" : ""}"
          data-drawer-ep="${idx + 1}"
          type="button"
        >
          <div class="drawer-ep-header">
            <span class="drawer-ep-num">EP ${ep.id}</span>
            <span class="drawer-ep-badge ${unlocked ? "badge-free" : "badge-locked"}">
              ${unlocked ? (ep.isFree ? "FREE" : "UNLOCKED") : "🔒 LOCK"}
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

  function loadEpisode(index) {
    currentEpisodeIndex = Math.max(0, Math.min(index, currentEpisodes.length - 1));
    const ep = currentEpisodes[currentEpisodeIndex];
    if (!ep) return;

    const unlocked = isEpisodeUnlocked(currentSeries.id, ep.id, ep.isFree);

    if (epBadge) epBadge.textContent = `Ep ${ep.id}`;
    if (epTitle) epTitle.textContent = ep.title;
    if (lockedEpNum) lockedEpNum.textContent = `${ep.id}`;

    closeDrawer();

    // Locked Episode State
    if (!unlocked) {
      video.pause();
      video.removeAttribute("src");
      video.load();

      if (playIndicator) playIndicator.classList.remove("active");
      hideHUD();
      showStatus("");

      if (lockModal) lockModal.style.display = "flex";
      return;
    }

    // Unlocked Episode State
    if (lockModal) lockModal.style.display = "none";
    if (adModal) adModal.style.display = "none";
    showStatus("Buffering stream...");

    video.src = ep.src;
    video.load();

    const saved = getSeriesProgress(currentSeries.id);
    if (saved && saved.episodeId === ep.id && saved.position > 1) {
      video.currentTime = saved.position;
    }

    video
      .play()
      .then(() => {
        if (playIndicator) playIndicator.classList.remove("active");
        showHUD();
      })
      .catch(() => {
        if (playIndicator) playIndicator.classList.add("active");
        showHUD();
      });
  }

  // ========================================
  // Rewarded Ad Simulation Engine (Section 18)
  // ========================================
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
      if (adProgressFill) {
        adProgressFill.style.width = `${progressPercent}%`;
      }
      if (elapsed >= totalDurationMs) {
        clearInterval(adProgressInterval);
      }
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

        // Unlock scoped to this series and episode
        unlockEpisode(currentSeries.id, ep.id);

        setTimeout(() => {
          completeAdAndPlay(ep.id);
        }, 1200);
      }
    }, 1000);
  }

  function completeAdAndPlay(epId) {
    clearInterval(adTimerInterval);
    clearInterval(adProgressInterval);

    if (adModal) adModal.style.display = "none";
    showToast(`🎉 Episode ${epId} Unlocked!`);
    loadEpisode(currentEpisodeIndex);
  }

  if (adSkipBtn) {
    adSkipBtn.onclick = () => {
      if (!adSkipBtn.disabled) {
        const ep = currentEpisodes[currentEpisodeIndex];
        completeAdAndPlay(ep.id);
      }
    };
  }

  // Swipe and Tap Gestures
  let touchStartY = 0;
  let touchStartX = 0;
  let touchStartTime = 0;

  if (gestureSurface) {
    gestureSurface.addEventListener("touchstart", (e) => {
      touchStartY = e.changedTouches[0].screenY;
      touchStartX = e.changedTouches[0].screenX;
      touchStartTime = Date.now();
    }, { passive: true });

    gestureSurface.addEventListener("touchend", (e) => {
      const ep = currentEpisodes[currentEpisodeIndex];
      const isLocked = !isEpisodeUnlocked(currentSeries.id, ep.id, ep.isFree);

      const touchEndY = e.changedTouches[0].screenY;
      const touchEndX = e.changedTouches[0].screenX;
      const diffY = touchStartY - touchEndY;
      const diffX = touchStartX - touchEndX;
      const duration = Date.now() - touchStartTime;

      if (Math.abs(diffY) > 60 && Math.abs(diffY) > Math.abs(diffX) * 1.2) {
        if (diffY > 0) {
          if (currentEpisodeIndex < currentEpisodes.length - 1) {
            showToast("Advancing to Next Episode");
            loadEpisode(currentEpisodeIndex + 1);
          } else {
            showToast("You've reached the latest episode");
          }
        } else {
          if (currentEpisodeIndex > 0) {
            showToast("Returning to Previous Episode");
            loadEpisode(currentEpisodeIndex - 1);
          } else {
            showToast("This is the first episode");
          }
        }
        return;
      }

      if (!isLocked && duration < 350 && Math.abs(diffY) < 15 && Math.abs(diffX) < 15) {
        handleTapToggle();
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
      if (likeCounter) {
        likeCounter.textContent = `${(likeCount / 1000).toFixed(1)}K`;
      }
      showToast(isLiked ? "Added to Liked Videos ♥" : "Removed Like");
      showHUD();
    };
  }

  if (favBtn) {
    favBtn.onclick = (e) => {
      e.stopPropagation();
      isFavorited = !isFavorited;
      favBtn.classList.toggle("active", isFavorited);
      if (favLabel) favLabel.textContent = isFavorited ? "Saved ★" : "Collect";
      showToast(isFavorited ? "Added to My List ★" : "Removed from My List");
      showHUD();
    };
  }

  const commentBtn = document.getElementById("btn-action-comment");
  if (commentBtn) {
    commentBtn.onclick = (e) => {
      e.stopPropagation();
      showToast("Comments open on live release 💬");
      showHUD();
    };
  }

  if (shareBtn) {
    shareBtn.onclick = (e) => {
      e.stopPropagation();
      if (navigator.share) {
        navigator.share({
          title: `${currentSeries.title} on Minsplay`,
          text: `Watch ${currentSeries.title} on Minsplay!`,
          url: window.location.href,
        }).catch(() => {});
      } else {
        const dummy = document.createElement("input");
        document.body.appendChild(dummy);
        dummy.value = window.location.href;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
        showToast("Link copied to clipboard ↗");
      }
      showHUD();
    };
  }

  if (soundBtn) {
    soundBtn.onclick = (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
      showToast(video.muted ? "Muted 🔇" : "Sound Unmuted 🔊");
      showHUD();
    };
  }

  if (fullscreenBtn) {
    fullscreenBtn.onclick = (e) => {
      e.stopPropagation();
      const stage = document.getElementById("watch-stage");
      if (!document.fullscreenElement) {
        if (stage && stage.requestFullscreen) {
          stage.requestFullscreen();
        } else if (video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen();
        }
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
      showHUD();
    };
  }

  if (openDrawerBtn) {
    openDrawerBtn.onclick = (e) => {
      e.stopPropagation();
      openDrawer();
    };
  }

  if (closeDrawerBtn) closeDrawerBtn.onclick = closeDrawer;
  if (drawerBackdrop) drawerBackdrop.onclick = closeDrawer;

  if (lockOpenDrawerBtn) {
    lockOpenDrawerBtn.onclick = () => {
      openDrawer();
    };
  }

  if (drawerGrid) {
    drawerGrid.onclick = (e) => {
      const card = e.target.closest("[data-drawer-ep]");
      if (card) {
        const epNum = parseInt(card.getAttribute("data-drawer-ep"), 10);
        loadEpisode(epNum - 1);
      }
    };
  }

  if (unlockBtn) {
    unlockBtn.onclick = () => {
      startRewardedAdFlow();
    };
  }

  const startIdx = Math.max(0, Math.min(initialEp - 1, currentEpisodes.length - 1));
  loadEpisode(startIdx);
}