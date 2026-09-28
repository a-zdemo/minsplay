import { saveProgress, getSeriesProgress, isEpisodeUnlocked, unlockEpisode } from "./storage.js";

export const EPISODES = [
  {
    id: 1,
    title: "Episode 1: The Encounter",
    duration: "1m 45s",
    isFree: true,
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
  {
    id: 2,
    title: "Episode 2: Deep Water",
    duration: "2m 10s",
    isFree: true,
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  },
  {
    id: 3,
    title: "Episode 3: The Crossroad",
    duration: "1m 55s",
    isFree: false,
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  },
  {
    id: 4,
    title: "Episode 4: Payback",
    duration: "2m 05s",
    isFree: false,
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
  },
  {
    id: 5,
    title: "Episode 5: The Reckoning",
    duration: "2m 30s",
    isFree: false,
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
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

  if (!video) return;

  function loadEpisode(index) {
    currentEpisodeIndex = index;
    const ep = EPISODES[index];
    if (!ep) return;

    const unlocked = isEpisodeUnlocked(ep.id, ep.isFree);

    epName.textContent = `Episode ${ep.id}`;
    currentTitle.textContent = ep.title;

    // Update strip button statuses
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

    // Gating check
    if (!unlocked) {
      video.pause();
      video.removeAttribute("src");
      lockOverlay.style.display = "flex";
      return;
    }

    lockOverlay.style.display = "none";
    video.src = ep.src;

    // Check if we have saved progress for this episode to resume
    const saved = getSeriesProgress(SERIES_ID);
    if (saved && saved.episodeId === ep.id && saved.position > 2) {
      video.currentTime = saved.position;
    }

    video.play().catch(() => {
      playToggle.textContent = "▶";
    });
  }

  // Periodic progress saving (throttled)
  let lastSavedSecond = 0;
  video.addEventListener("timeupdate", () => {
    const current = Math.floor(video.currentTime);
    if (current > 0 && current !== lastSavedSecond && current % 2 === 0) {
      lastSavedSecond = current;
      const ep = EPISODES[currentEpisodeIndex];
      saveProgress(SERIES_ID, ep.id, video.currentTime, video.duration || 0);
    }
  });

  // Play / Pause handling
  touchOverlay.addEventListener("click", () => {
    if (video.paused) {
      video.play();
      playToggle.textContent = "⏸";
      setTimeout(() => (playToggle.style.opacity = "0"), 800);
    } else {
      video.pause();
      playToggle.textContent = "▶";
      playToggle.style.opacity = "1";
    }
  });

  video.addEventListener("play", () => {
    playToggle.textContent = "⏸";
    setTimeout(() => (playToggle.style.opacity = "0"), 800);
  });

  video.addEventListener("pause", () => {
    playToggle.textContent = "▶";
    playToggle.style.opacity = "1";
  });

  // Episode strip navigation
  if (stripContainer) {
    stripContainer.onclick = (e) => {
      const btn = e.target.closest(".strip-ep-btn");
      if (btn) {
        const epNum = parseInt(btn.getAttribute("data-episode"), 10);
        loadEpisode(epNum - 1);
      }
    };
  }

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

  // Load initial episode
  const startIdx = Math.max(0, Math.min(initialEp - 1, EPISODES.length - 1));
  loadEpisode(startIdx);
}
