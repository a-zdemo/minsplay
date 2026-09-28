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

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function initPlayer(initialEp = 1) {
  const videoStage = document.getElementById("video-stage");
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
  const seekSlider = document.getElementById("video-seek");
  const timeDisplay = document.getElementById("video-time-display");
  const fullscreenBtn = document.getElementById("btn-fullscreen");

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

    const saved = getSeriesProgress(SERIES_ID);
    if (saved && saved.episodeId === ep.id && saved.position > 2) {
      video.currentTime = saved.position;
    }

    setPlayIndicator(false);
  }

  // Playback sync events
  video.oncanplay = () => showStatus("");
  video.onplaying = () => {
    showStatus("");
    setPlayIndicator(true);
  };
  video.onpause = () => setPlayIndicator(false);

  video.onerror = () => {
    showStatus("Playback error loading video");
    setPlayIndicator(false);
  };

  // Video progress & scrubber sync
  let lastSavedSec = 0;
  video.ontimeupdate = () => {
    const cur = video.currentTime || 0;
    const dur = video.duration || 0;

    if (seekSlider && dur > 0 && !seekSlider.matches(":active")) {
      seekSlider.value = (cur / dur) * 100;
    }

    if (timeDisplay) {
      timeDisplay.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;
    }

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
      }
    };
  }

  // Tap video to toggle play/pause
  if (touchOverlay) {
    touchOverlay.onclick = (e) => {
      e.preventDefault();
      if (video.paused) {
        video
          .play()
          .then(() => setPlayIndicator(true))
          .catch(() => setPlayIndicator(false));
      } else {
        video.pause();
        setPlayIndicator(false);
      }
    };
  }

  // Fullscreen button
  if (fullscreenBtn && videoStage) {
    fullscreenBtn.onclick = (e) => {
      e.stopPropagation();
      if (!document.fullscreenElement) {
        if (videoStage.requestFullscreen) {
          videoStage.requestFullscreen();
        } else if (video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    };
  }

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

  // Unlock action
  if (unlockBtn) {
    unlockBtn.onclick = () => {
      const ep = EPISODES[currentEpisodeIndex];
      unlockEpisode(ep.id);
      loadEpisode(currentEpisodeIndex);
    };
  }

  const startIdx = Math.max(0, Math.min(initialEp - 1, EPISODES.length - 1));
  loadEpisode(startIdx);
}
