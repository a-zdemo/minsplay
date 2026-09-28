import { saveProgress, getSeriesProgress, isEpisodeUnlocked, unlockEpisode } from "./storage.js";

// Fast, lightweight, globally accessible test streams
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
    duration: "1m 55s",
    isFree: false,
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    id: 4,
    title: "Episode 4: Payback",
    duration: "2m 05s",
    isFree: false,
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    id: 5,
    title: "Episode 5: The Reckoning",
    duration: "2m 30s",
    isFree: false,
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
];

let currentEpisodeIndex = 0;
const SERIES_ID = "the-beginning";

export function initPlayer(initialEp = 1) {
  const video = document.getElementById("minsplay-video");
  const playToggle = document.getElementById("video-play-toggle");
  const touchOverlay = document.getElementById("video-touch-overlay");
  const lockOverlay = document.getElementById("video-lock-overlay");
  const epName = document.getElementById("watch-ep-name");
  const currentTitle = document.getElementById("watch-current-title");
  const prevBtn = document.getElementById("btn-prev-ep");
  const nextBtn = document.getElementById("btn-next-ep");
  const stripContainer = document.getElementById("watch-episode-list");
  const unlockBtn = document.getElementById("btn-unlock-mock");
  const statusBadge = document.getElementById("video-status-msg");

  if (!video) return;

  function showStatus(msg) {
    if (statusBadge) {
      statusBadge.textContent = msg;
      statusBadge.style.display = msg ? "block" : "none";
    }
  }

  function setPlayIndicator(isPlaying) {
    if (playToggle) {
      if (isPlaying) {
        playToggle.textContent = "⏸";
        playToggle.style.opacity = "0";
      } else {
        playToggle.textContent = "▶";
        playToggle.style.opacity = "1";
      }
    }
  }

  function loadEpisode(index) {
    currentEpisodeIndex = index;
    const ep = EPISODES[index];
    if (!ep) return;

    const unlocked = isEpisodeUnlocked(ep.id, ep.isFree);

    if (epName) epName.textContent = `Episode ${ep.id}`;
    if (currentTitle) currentTitle.textContent = ep.title;

    // Episode button strip state
    if (stripContainer) {
      const buttons = stripContainer.querySelectorAll(".strip-ep-btn");
      buttons.forEach((btn, idx) => {
        btn.classList.toggle("active", idx === index);
        const epData = EPISODES[idx];
        const isThisUnlocked = isEpisodeUnlocked(epData.id, epData.isFree);
        btn.classList.toggle("locked", !isThisUnlocked);
        btn.innerHTML = isThisUnlocked ? `${idx + 1}` : `${idx + 1} 🔒`;
      });
    }

    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === EPISODES.length - 1;

    // Check Lock
    if (!unlocked) {
      video.pause();
      video.removeAttribute("src");
      video.load();
      if (lockOverlay) lockOverlay.style.display = "flex";
      setPlayIndicator(false);
      showStatus("");
      return;
    }

    if (lockOverlay) lockOverlay.style.display = "none";

    showStatus("Buffering stream...");
    video.src = ep.src;
    video.load();

    // Check saved resume point
    const saved = getSeriesProgress(SERIES_ID);
    if (saved && saved.episodeId === ep.id && saved.position > 2) {
      video.currentTime = saved.position;
    }

    setPlayIndicator(false);
  }

  // Video event handlers
  video.oncanplay = () => {
    showStatus("");
  };

  video.onplaying = () => {
    showStatus("");
    setPlayIndicator(true);
  };

  video.onpause = () => {
    setPlayIndicator(false);
  };

  video.onerror = () => {
    const err = video.error;
    let message = "Playback error";
    if (err) {
      if (err.code === 2) message = "Network error loading video";
      else if (err.code === 3) message = "Decode error";
      else if (err.code === 4) message = "Format not supported by browser";
    }
    showStatus(message);
    setPlayIndicator(false);
  };

  // Tap handler to toggle play/pause
  if (touchOverlay) {
    touchOverlay.onclick = (e) => {
      e.preventDefault();
      if (video.paused) {
        showStatus("Loading...");
        video
          .play()
          .then(() => {
            showStatus("");
            setPlayIndicator(true);
          })
          .catch((err) => {
            console.warn("Minsplay playback:", err);
            showStatus("Tap to play");
            setPlayIndicator(false);
          });
      } else {
        video.pause();
        setPlayIndicator(false);
      }
    };
  }

  // Periodic watch progress saving
  let lastSavedSec = 0;
  video.ontimeupdate = () => {
    const cur = Math.floor(video.currentTime);
    if (cur > 0 && cur !== lastSavedSec && cur % 2 === 0) {
      lastSavedSec = cur;
      const ep = EPISODES[currentEpisodeIndex];
      saveProgress(SERIES_ID, ep.id, video.currentTime, video.duration || 0);
    }
  };

  // Strip Navigation
  if (stripContainer) {
    stripContainer.onclick = (e) => {
      const btn = e.target.closest(".strip-ep-btn");
      if (btn) {
        const epNum = parseInt(btn.getAttribute("data-episode"), 10);
        loadEpisode(epNum - 1);
      }
    };
  }

  // Prev / Next actions
  if (nextBtn) {
    nextBtn.onclick = () => {
      if (currentEpisodeIndex < EPISODES.length - 1) {
        loadEpisode(currentEpisodeIndex + 1);
      }
    };
  }

  if (prevBtn) {
    prevBtn.onclick = () => {
      if (currentEpisodeIndex > 0) {
        loadEpisode(currentEpisodeIndex - 1);
      }
    };
  }

  // Mock Reward Unlock Action
  if (unlockBtn) {
    unlockBtn.onclick = () => {
      const ep = EPISODES[currentEpisodeIndex];
      unlockEpisode(ep.id);
      loadEpisode(currentEpisodeIndex);
    };
  }

  // Initial load
  const startIdx = Math.max(0, Math.min(initialEp - 1, EPISODES.length - 1));
  loadEpisode(startIdx);
}
