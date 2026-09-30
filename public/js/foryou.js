import { DRAMA_CATALOG } from "./series-data.js";
import { showAppToast, navigateTo } from "./router.js";

let feedObserver = null;
let isMuted = true;

export function initForYouFeed() {
  const container = document.getElementById("foryou-feed-container");
  const soundBtn = document.getElementById("foryou-sound-toggle");
  if (!container) return;

  // Render vertical teaser cards for all 9 catalog dramas
  container.innerHTML = DRAMA_CATALOG.map((drama, idx) => {
    const ep1 = drama.episodes[0] || { src: "https://www.w3schools.com/html/mov_bbb.mp4" };
    return `
      <article class="foryou-slide" data-series-id="${drama.id}" data-index="${idx}">
        <video 
          class="foryou-video" 
          src="${ep1.src}" 
          loop 
          playsinline 
          webkit-playsinline 
          preload="metadata"
          ${isMuted ? "muted" : ""}
        ></video>

        <!-- Tap-to-toggle play/pause overlay -->
        <div class="foryou-touch-surface" data-action="toggle-play">
          <span class="foryou-play-pause-icon">▶</span>
        </div>

        <!-- Right Floating Social Rail -->
        <aside class="foryou-social-rail">
          <button class="foryou-rail-btn foryou-like-btn" type="button" data-action="like">
            <span class="rail-icon">♥</span>
            <span class="rail-label">${drama.plays}</span>
          </button>
          
          <button class="foryou-rail-btn foryou-fav-btn" type="button" data-action="fav">
            <span class="rail-icon">★</span>
            <span class="rail-label">Collect</span>
          </button>

          <button class="foryou-rail-btn" type="button" data-action="comment">
            <span class="rail-icon">💬</span>
            <span class="rail-label">348</span>
          </button>

          <button class="foryou-rail-btn" type="button" data-action="share" data-title="${drama.title}">
            <span class="rail-icon">↗</span>
            <span class="rail-label">Share</span>
          </button>
        </aside>

        <!-- Bottom Drama Metadata & 1-Tap Watch Button -->
        <div class="foryou-meta-overlay">
          <div class="foryou-meta-tags">
            <span class="foryou-badge ${drama.badgeClass || 'badge-hot'}">${drama.badge || 'Trending'}</span>
            <span class="foryou-genre-tag">${drama.genre}</span>
          </div>

          <h2 class="foryou-drama-title">${drama.title}</h2>
          <p class="foryou-drama-synopsis">${drama.synopsis}</p>

          <div class="foryou-action-row">
            <button class="btn-foryou-watch" type="button" data-route="/watch" data-series="${drama.id}" data-episode="1">
              <span>▶ Watch Full Drama</span>
              <span class="foryou-arrow">›</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  if (soundBtn) {
    soundBtn.textContent = isMuted ? "🔇" : "🔊";
    soundBtn.onclick = () => {
      isMuted = !isMuted;
      soundBtn.textContent = isMuted ? "🔇" : "🔊";
      container.querySelectorAll(".foryou-video").forEach((v) => {
        v.muted = isMuted;
      });
      showAppToast(isMuted ? "Audio Muted 🔇" : "Audio Unmuted 🔊");
    };
  }

  // IntersectionObserver to auto-play active teaser and pause off-screen ones
  if (feedObserver) feedObserver.disconnect();
  feedObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target.querySelector(".foryou-video");
        const playIcon = entry.target.querySelector(".foryou-play-pause-icon");
        if (!video) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          video.muted = isMuted;
          video.play().then(() => {
            if (playIcon) playIcon.style.opacity = "0";
          }).catch(() => {
            if (playIcon) playIcon.style.opacity = "1";
          });
        } else {
          video.pause();
          video.currentTime = 0;
          if (playIcon) playIcon.style.opacity = "0";
        }
      });
    },
    { threshold: [0.6] }
  );

  container.querySelectorAll(".foryou-slide").forEach((slide) => {
    feedObserver.observe(slide);
  });

  // Touch and social interactions
  container.onclick = (e) => {
    const target = e.target;

    const likeBtn = target.closest(".foryou-like-btn");
    if (likeBtn) {
      likeBtn.classList.toggle("active");
      showAppToast(likeBtn.classList.contains("active") ? "Liked Teaser ♥" : "Removed Like");
      return;
    }

    const favBtn = target.closest(".foryou-fav-btn");
    if (favBtn) {
      favBtn.classList.toggle("active");
      showAppToast(favBtn.classList.contains("active") ? "Saved to My List ★" : "Removed Bookmark");
      return;
    }

    const commentBtn = target.closest('[data-action="comment"]');
    if (commentBtn) {
      showAppToast("Comments drawer opening in Target 2 💬");
      return;
    }

    const shareBtn = target.closest('[data-action="share"]');
    if (shareBtn) {
      const title = shareBtn.getAttribute("data-title") || "Minsplay Short Drama";
      if (navigator.share) {
        navigator.share({ title, url: window.location.href }).catch(() => {});
      } else {
        showAppToast("Link copied to clipboard ↗");
      }
      return;
    }

    const surface = target.closest('.foryou-touch-surface');
    if (surface) {
      const slide = surface.closest('.foryou-slide');
      const video = slide ? slide.querySelector('.foryou-video') : null;
      const playIcon = surface.querySelector('.foryou-play-pause-icon');
      if (video) {
        if (video.paused) {
          video.play();
          if (playIcon) playIcon.style.opacity = "0";
        } else {
          video.pause();
          if (playIcon) playIcon.style.opacity = "1";
        }
      }
    }
  };
}

export function destroyForYouFeed() {
  if (feedObserver) {
    feedObserver.disconnect();
    feedObserver = null;
  }
  const container = document.getElementById("foryou-feed-container");
  if (container) {
    container.querySelectorAll(".foryou-video").forEach((v) => {
      v.pause();
      v.src = "";
    });
  }
}
