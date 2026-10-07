let isTransitioningEpisode = false;
import { showRewardedVideo, isAdDisplayingActive, checkAndShowTransitionInterstitial } from "./admob-manager.js";
import { fetchEpisodeComments, postEpisodeComment, likeEpisodeComment } from "./comments-api.js";
import { getCurrentUser } from "./auth.js";
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

// Ad intervals purged in favor of AdMob Engine

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
  const unlockAdBtn = document.getElementById("btn-unlock-admob") || document.getElementById("btn-unlock-mock");
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
  if (isAdDisplayingActive) {
    console.log("Blocking loadEpisode: Ad is active");
    return;
  }
  isTransitioningEpisode = true;
  if (playIndicator) playIndicator.style.display = "none";
    currentEpisodeIndex = Math.max(0, Math.min(index, currentEpisodes.length - 1));
    const ep = currentEpisodes[currentEpisodeIndex];
    if (!ep || !currentSeries) return;

    const splashOverlay = document.getElementById("watch-poster-splash");
    const splashImg = document.getElementById("splash-poster-img");
    const splashTitle = document.getElementById("splash-title");
    const splashBadge = document.getElementById("splash-ep-badge");
    const splashBlur = document.getElementById("splash-backdrop-blur");
    const posterSrc = ep.posterUrl || currentSeries.posterUrl || "/icons/icon-192.png";
    if (splashImg) splashImg.src = posterSrc;
    if (splashBlur) splashBlur.style.backgroundImage = `url('${posterSrc}')`;
    if (splashTitle) splashTitle.textContent = currentSeries.title || "Minsplay";
    if (splashBadge) splashBadge.textContent = `Episode ${ep.id}`;
    if (splashOverlay) { splashOverlay.classList.remove("splash-hidden"); splashOverlay.style.display = "flex"; }
    preloadTriggeredForEpisode = -1;
    const unlocked = isEpisodeUnlocked(currentSeries.id, ep.id, ep.isFree);

    const seriesName = currentSeries.shortTitle || currentSeries.title;
    document.querySelectorAll(".hud-series-title").forEach((el) => el.textContent = seriesName);
    if (epBadge) epBadge.textContent = `Ep ${ep.id}`;
    if (epTitle) epTitle.textContent = ep.title;
    syncCommentsForCurrentEpisode();
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
      video.muted = true;
      video.play().then(() => {
        showStatus("");
        if (playIndicator) playIndicator.classList.remove("active");
        if (soundBtn) soundBtn.textContent = "🔇";
        showAppToast("Playing (Muted). Tap 🔊 to unmute");
        showHUD();
      }).catch(() => {
        showStatus("");
        if (playIndicator) playIndicator.classList.add("active");
        showHUD();
      });
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

  // REWARDED AD: Unlock via AdMob
  if (unlockAdBtn) {
    unlockAdBtn.onclick = () => {
      const ep = currentEpisodes[currentEpisodeIndex];
      if (!ep || !currentSeries) return;

      showRewardedVideo({
        placement: "episode_unlock",
        onReward: () => {
          unlockEpisode(currentSeries.id, ep.id);
          showAppToast(`🎉 Episode ${ep.id} Unlocked via Ad!`);
          if (lockModal) lockModal.style.display = "none";
          loadEpisode(currentEpisodeIndex);
        },
        onDismiss: () => {
          showAppToast("Watch the full ad to unlock the episode.");
        }
      });
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

  function goToNextEpisode() {
    if (currentEpisodeIndex < currentEpisodes.length - 1) {
      showAppToast(`▶ Next: Episode ${currentEpisodes[currentEpisodeIndex + 1].id}`);
      checkAndShowTransitionInterstitial().finally(() => {
        loadEpisode(currentEpisodeIndex + 1);
      });
    } else {
      const cat = getSeriesById() ? (window.DRAMA_CATALOG || []) : [];
      showAppToast("🎬 Series Completed! Great binge.");
    }
  }

  function goToPrevEpisode() {
    if (currentEpisodeIndex > 0) {
      showAppToast(`◀ Previous: Episode ${currentEpisodes[currentEpisodeIndex - 1].id}`);
      loadEpisode(currentEpisodeIndex - 1);
    } else {
      showAppToast("⏮ You are at Episode 1");
    }
  }

  video.onended = async () => { goToNextEpisode(); };

  video.onplaying = () => {
    isTransitioningEpisode = false;
    const pi = document.getElementById("center-play-indicator");
    if (pi) { pi.classList.remove("active"); pi.style.display = "none"; }
    const sp = document.getElementById("watch-poster-splash");
    if (sp) { sp.classList.add("splash-hidden"); setTimeout(() => { if (sp.classList.contains("splash-hidden")) sp.style.display = "none"; }, 320); }
  };


  // Touch Swipe Gestures
  let touchStartY = 0, touchStartX = 0, isTouching = false;
  const gestureSurface = document.getElementById("video-gesture-surface") || playerRoot || document;

  gestureSurface.ontouchstart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    isTouching = true;
  };

  gestureSurface.ontouchmove = (e) => {
    if (!isTouching || !e.touches || e.touches.length === 0) return;
    const dy = Math.abs(e.touches[0].clientY - touchStartY);
    if (dy > 8) e.preventDefault();
  };

  gestureSurface.ontouchend = (e) => {
    if (!isTouching) return;
    isTouching = false;
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const diffY = touchStartY - e.changedTouches[0].clientY;
    const diffX = touchStartX - e.changedTouches[0].clientX;

    if (e.target.closest("button, input, select, .drawer-sheet-box, .auth-sheet, .lock-modal-dialog, .rewarded-ad-modal")) return;

    if (Math.abs(diffY) > 40 && Math.abs(diffY) > Math.abs(diffX) * 1.1) {
      if (diffY > 0) goToNextEpisode();
      else goToPrevEpisode();
      return;
    }

    if (Math.abs(diffY) < 15 && Math.abs(diffX) < 15) {
      if (video.paused) {
        video.play().then(() => playIndicator?.classList.remove("active")).catch(() => {});
      } else {
        video.pause();
        playIndicator?.classList.add("active");
      }
      showHUD();
    }
  };

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
  
  // Live Comments Drawer Controls
  const commentBtn = document.getElementById("btn-action-comment");
  const commentCounter = document.getElementById("comment-counter");
  const commentsBackdrop = document.getElementById("comments-drawer-backdrop");
  const closeCommentsBtn = document.getElementById("btn-close-comments-drawer");
  const commentsFeed = document.getElementById("comments-feed-list");
  const commentsCountHeader = document.getElementById("comments-sheet-count");
  const commentInput = document.getElementById("input-comment-text");
  const sendCommentBtn = document.getElementById("btn-send-comment");

  async function syncCommentsForCurrentEpisode() {
    if (!currentSeries) return;
    const ep = currentEpisodes[currentEpisodeIndex];
    if (!ep) return;
    const comments = await fetchEpisodeComments(currentSeries.id, ep.id);
    if (commentCounter) commentCounter.textContent = comments.length.toString();
    if (commentsCountHeader) commentsCountHeader.textContent = comments.length.toString();
    if (commentsFeed) {
      if (comments.length === 0) {
        commentsFeed.innerHTML = '<div style="text-align:center;padding:36px;color:rgba(255,255,255,0.4);"><p>No comments yet.<br>Be the first to share your thoughts!</p></div>';
      } else {
        commentsFeed.innerHTML = comments.map(c => `
          <div class="comment-item">
            <img class="comment-avatar" src="${c.avatar || '/icons/icon-192.png'}" onerror="this.src='/icons/icon-192.png';" alt="${c.username}" />
            <div class="comment-body">
              <div class="comment-user-row">
                <span class="comment-user-name">${c.username}</span>
                <button class="comment-like-btn" data-cid="${c.id}" data-likes="${c.likes || 0}" type="button">♥ ${c.likes || 0}</button>
              </div>
              <p class="comment-text">${c.content}</p>
            </div>
          </div>
        `).join("");
        commentsFeed.querySelectorAll(".comment-like-btn").forEach(btn => {
          btn.onclick = async () => {
            const cid = btn.dataset.cid;
            const curLikes = parseInt(btn.dataset.likes, 10);
            await likeEpisodeComment(cid, curLikes);
            btn.textContent = `♥ ${curLikes + 1}`;
          };
        });
      }
    }
  }

  if (commentBtn) {
    commentBtn.onclick = (e) => {
      e.stopPropagation();
      syncCommentsForCurrentEpisode();
      if (commentsBackdrop) commentsBackdrop.style.display = "flex";
    };
  }

  if (closeCommentsBtn) closeCommentsBtn.onclick = () => { if (commentsBackdrop) commentsBackdrop.style.display = "none"; };
  if (commentsBackdrop) commentsBackdrop.onclick = (e) => { if (e.target === commentsBackdrop) commentsBackdrop.style.display = "none"; };

  if (sendCommentBtn && commentInput) {
    sendCommentBtn.onclick = async () => {
      const text = commentInput.value.trim();
      if (!text || !currentSeries) return;
      const ep = currentEpisodes[currentEpisodeIndex];
      const curUser = getCurrentUser();
      sendCommentBtn.disabled = true;
      await postEpisodeComment({ seriesId: currentSeries.id, episodeId: ep.id, content: text, user: curUser });
      commentInput.value = "";
      sendCommentBtn.disabled = false;
      syncCommentsForCurrentEpisode();
    };
  }

    const ccBtn = document.getElementById("btn-cc-toggle");
  const subModal = document.getElementById("subtitles-modal-backdrop");
  const closeSubBtn = document.getElementById("btn-close-subtitles-modal");
  const subCue = document.getElementById("subtitles-cue");
  if (ccBtn && subModal) { ccBtn.onclick = (e) => { e.stopPropagation(); subModal.style.display = "flex"; }; }
  if (closeSubBtn && subModal) { closeSubBtn.onclick = () => { subModal.style.display = "none"; }; }
  if (subModal) {
    subModal.onclick = (e) => {
      if (e.target === subModal) subModal.style.display = "none";
      const opt = e.target.closest(".sub-lang-option");
      if (opt) {
        const lang = opt.getAttribute("data-lang");
        subModal.querySelectorAll(".sub-lang-radio").forEach(r => r.textContent = "");
        const radio = opt.querySelector(".sub-lang-radio");
        if (radio) radio.textContent = "✓";
        if (lang === "off") {
          if (ccBtn) ccBtn.classList.remove("active");
          if (subCue) { subCue.textContent = ""; subCue.style.display = "none"; }
          showAppToast("Subtitles: Off");
        } else {
          if (ccBtn) ccBtn.classList.add("active");
          showAppToast(`Subtitles: ${lang.toUpperCase()}`);
        }
        subModal.style.display = "none";
      }
    };
  }

  syncCommentsForCurrentEpisode();
  loadEpisode(startIdx);
}
