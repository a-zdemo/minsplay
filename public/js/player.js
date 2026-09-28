// Test dataset for Series A (The Beginning) per Section 24 of spec
export const EPISODES = [
  {
    id: 1,
    title: "Episode 1: The Encounter",
    duration: "1m 45s",
    isFree: true,
    // Mobile-optimized public test stream (H.264 MP4)
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

    // Check unlocked state stored locally
    const unlockedList = JSON.parse(localStorage.getItem("minsplay_unlocked") || "[]");
    const isUnlocked = ep.isFree || unlockedList.includes(ep.id);

    epName.textContent = `Episode ${ep.id}`;
    currentTitle.textContent = ep.title;

    // Update strip active class
    if (stripContainer) {
      const buttons = stripContainer.querySelectorAll(".strip-ep-btn");
      buttons.forEach((btn, idx) => {
        btn.classList.toggle("active", idx === index);
        const unlockedThis = EPISODES[idx].isFree || unlockedList.includes(EPISODES[idx].id);
        btn.classList.toggle("locked", !unlockedThis);
        btn.innerHTML = unlockedThis ? `${idx + 1}` : `${idx + 1} 🔒`;
      });
    }

    // Previous / Next button bounds
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === EPISODES.length - 1;

    if (!isUnlocked) {
      video.pause();
      video.removeAttribute("src");
      lockOverlay.style.display = "flex";
      return;
    }

    lockOverlay.style.display = "none";
    video.src = ep.src;
    video.play().catch(() => {
      // Autoplay with sound might require user gesture in Chrome mobile
      playToggle.textContent = "▶";
    });
  }

  // Play/Pause Tap on video
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

  // Next / Prev listeners
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

  // Strip button clicks
  if (stripContainer) {
    stripContainer.onclick = (e) => {
      const btn = e.target.closest(".strip-ep-btn");
      if (btn) {
        const epNum = parseInt(btn.getAttribute("data-episode"), 10);
        loadEpisode(epNum - 1);
      }
    };
  }

  // Mock Unlock Button (Step 8/9 preview)
  if (unlockBtn) {
    unlockBtn.onclick = () => {
      const ep = EPISODES[currentEpisodeIndex];
      const unlockedList = JSON.parse(localStorage.getItem("minsplay_unlocked") || "[]");
      if (!unlockedList.includes(ep.id)) {
        unlockedList.push(ep.id);
        localStorage.setItem("minsplay_unlocked", JSON.stringify(unlockedList));
      }
      loadEpisode(currentEpisodeIndex);
    };
  }

  // Initial load
  const startIdx = Math.max(0, Math.min(initialEp - 1, EPISODES.length - 1));
  loadEpisode(startIdx);
}
