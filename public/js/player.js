import { saveProgress, getSeriesProgress, isEpisodeUnlocked, unlockEpisode } from "./storage.js";

export const EPISODES = [
  {
    id: 1,
    title: "Episode 1: The Encounter",
    duration: "0m 10s",
    isFree: true,
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    id: 2,
    title: "Episode 2: Deep Water",
    duration: "0m 10s",
    isFree: true,
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    id: 3,
    title: "Episode 3: The Crossroad",
    duration: "0m 10s",
    isFree: false,
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    id: 4,
    title: "Episode 4: Payback",
    duration: "0m 10s",
    isFree: false,
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    id: 5,
    title: "Episode 5: The Reckoning",
    duration: "0m 10s",
    isFree: false,
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
];

let currentEpisodeIndex = 0;
const SERIES_ID = "the-beginning";
let hudTimer = null;
let isLiked = false;
let isFavorited = false;
let likeCount = 14200;

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function initPlayer(initialEp = 1) {
  const video = document.getElementById("minsplay-video");
  const gestureSurface = document.getElementById("gesture-surface");
  const playIndicator = document.getElementById("center-play-indicator");
  const lockModal = document.getElementById("watch-lock-modal");
  const lockedEpNum = document.getElementById("locked-ep-number");
  const unlockBtn = document.getElementById("btn-unlock-mock");
  const statusPill = document.getElementById("hud-status-pill");

  // Floating HUD containers
  const hudTop = document.getElementById("hud-top");
  const hudRight = document.getElementById("hud-right");
  const hudBottom = document.getElementById("hud-bottom");
  const swipeHint = document.getElementById("hud-swipe-hint");

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
    // If video is actively playing, fade out overlay after 3 seconds of inactivity
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

  function triggerPlayIndicator(isPlaying) {
    if (!playIndicator) return;
    if (isPlaying) {
      playIndicator.classList.remove("active");
    } else {
      playIndicator.classList.add("active");
    }
  }

  function renderDrawerGrid() {
    if (!drawerGrid) return;
    drawerGrid.innerHTML = EPISODES.map((ep, idx) => {
      const unlocked = isEpisodeUnlocked(ep.id, ep.isFree);
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
    currentEpisodeIndex = Math.max(0, Math.min(index, EPISODES.length - 1));
    const ep = EPISODES[currentEpisodeIndex];
    if (!ep) return;

    const unlocked = isEpisodeUnlocked(ep.id, ep.isFree);

    if (epBadge) epBadge.textContent = `Ep ${ep.id}`;
    if (epTitle) epTitle.textContent = ep.title;
    if (lockedEpNum) lockedEpNum.textContent = `${ep.id}`;

    // Close drawer if open
    closeDrawer();

    if (!unlocked) {
      video.pause();
      video.removeAttribute("src");
      video.load();
      if (lockModal) lockModal.style.display = "flex";
      triggerPlayIndicator(false);
      showStatus("");
      return;
    }

    if (lockModal) lockModal.style.display = "none";
    showStatus("Buffering stream...");

    video.src = ep.src;
    video.load();

    // Check saved resume point
    const saved = getSeriesProgress(SERIES_ID);
    if (saved && saved.episodeId === ep.id && saved.position > 1) {
      video.currentTime = saved.position;
    }

    // Attempt playback
    video
      .play()
      .then(() => {
        triggerPlayIndicator(true);
        showHUD();
      })
      .catch(() => {
        triggerPlayIndicator(false);
        showHUD();
      });
  }

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
      const touchEndY = e.changedTouches[0].screenY;
      const touchEndX = e.changedTouches[0].screenX;
      const diffY = touchStartY - touchEndY;
      const diffX = touchStartX - touchEndX;
      const duration = Date.now() - touchStartTime;

      // Vertical swipe gesture takes priority if vertical movement is dominant (>60px)
      if (Math.abs(diffY) > 60 && Math.abs(diffY) > Math.abs(diffX) * 1.2) {
        if (diffY > 0) {
          // Swiped UP -> Next Episode
          if (currentEpisodeIndex < EPISODES.length - 1) {
            showToast("Advancing to Next Episode");
            loadEpisode(currentEpisodeIndex + 1);
          } else {
            showToast("You've reached the latest episode");
          }
        } else {
          // Swiped DOWN -> Previous Episode
          if (currentEpisodeIndex > 0) {
            showToast("Returning to Previous Episode");
            loadEpisode(currentEpisodeIndex - 1);
          } else {
            showToast("This is the first episode");
          }
        }
        return;
      }

      // Tap gesture handling (short touch with negligible movement)
      if (duration < 350 && Math.abs(diffY) < 15 && Math.abs(diffX) < 15) {
        handleTapToggle();
      }
    }, { passive: true });
  }

  function handleTapToggle() {
    const isHudHidden = hudBottom && hudBottom.classList.contains("hud-hidden");

    if (isHudHidden) {
      // Restore HUD when screen is touched
      showHUD();
    } else {
      // Toggle play / pause when HUD is currently visible
      if (video.paused) {
        video.play().then(() => {
          triggerPlayIndicator(true);
          showHUD();
        });
      } else {
        video.pause();
        triggerPlayIndicator(false);
        showHUD();
      }
    }
  }

  video.oncanplay = () => showStatus("");
  video.onplaying = () => {
    showStatus("");
    triggerPlayIndicator(true);
    showHUD();
  };
  video.onpause = () => {
    triggerPlayIndicator(false);
    showHUD();
  };
  video.onerror = () => {
    showStatus("Stream error loading video");
    triggerPlayIndicator(false);
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

    // Save timestamp every 2 seconds
    const curSec = Math.floor(cur);
    if (curSec > 0 && curSec !== lastSavedSec && curSec % 2 === 0) {
      lastSavedSec = curSec;
      const ep = EPISODES[currentEpisodeIndex];
      saveProgress(SERIES_ID, ep.id, cur, dur);
    }
  };

  // Scrubber scrubbing
  if (seekSlider) {
    seekSlider.oninput = () => {
      const dur = video.duration || 0;
      if (dur > 0) {
        video.currentTime = (seekSlider.value / 100) * dur;
        showHUD();
      }
    };
  }

  // Like button toggle
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

  // Favorite / Bookmark button toggle
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

  // Comments button
  const commentBtn = document.getElementById("btn-action-comment");
  if (commentBtn) {
    commentBtn.onclick = (e) => {
      e.stopPropagation();
      showToast("Comments open on live release 💬");
      showHUD();
    };
  }

  // Share button
  if (shareBtn) {
    shareBtn.onclick = (e) => {
      e.stopPropagation();
      if (navigator.share) {
        navigator.share({
          title: "The Beginning on Minsplay",
          text: "Watch this trending drama short series on Minsplay!",
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

  // Sound toggle button
  if (soundBtn) {
    soundBtn.onclick = (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
      showToast(video.muted ? "Muted 🔇" : "Sound Unmuted 🔊");
      showHUD();
    };
  }

  // Fullscreen button
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

  // Drawer open / close handlers
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
      if (lockModal) lockModal.style.display = "none";
      openDrawer();
    };
  }

  // Drawer episode selection
  if (drawerGrid) {
    drawerGrid.onclick = (e) => {
      const card = e.target.closest("[data-drawer-ep]");
      if (card) {
        const epNum = parseInt(card.getAttribute("data-drawer-ep"), 10);
        loadEpisode(epNum - 1);
      }
    };
  }

  // Mock Reward Unlock
  if (unlockBtn) {
    unlockBtn.onclick = () => {
      const ep = EPISODES[currentEpisodeIndex];
      unlockEpisode(ep.id);
      showToast(`Episode ${ep.id} Unlocked! 🎉`);
      loadEpisode(currentEpisodeIndex);
    };
  }

  const startIdx = Math.max(0, Math.min(initialEp - 1, EPISODES.length - 1));
  loadEpisode(startIdx);
}