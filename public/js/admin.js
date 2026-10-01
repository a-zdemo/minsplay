import { DRAMA_CATALOG, saveCatalogToStorage } from "./series-data.js";
import { showAppToast, navigateTo } from "./router.js";
import { getCurrentUser, ROLES } from "./auth.js";

const R2_BASE = "https://pub-446cc5245dc94ce0afede5f9a591d746.r2.dev";
let currentEditingSeriesId = null;
let currentEditingEpisodeId = 1;

export function initAdminDashboard() {
  syncMetrics();
  renderDramaQueue();
  renderCreatorQueue();
  renderCommentQueue();
  attachAdminActions();
  attachStreamEditorEvents();

  const refreshBtn = document.getElementById("btn-admin-refresh");
  if (refreshBtn) {
    refreshBtn.onclick = () => {
      syncMetrics();
      renderDramaQueue();
      showAppToast("Moderation feeds synced ✓");
    };
  }

  const tabsBar = document.getElementById("admin-nav-tabs");
  if (tabsBar) {
    tabsBar.onclick = (e) => {
      const btn = e.target.closest(".admin-tab-btn");
      if (!btn) return;
      tabsBar.querySelectorAll(".admin-tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const paneId = btn.getAttribute("data-pane");
      document.querySelectorAll(".admin-pane").forEach((pane) => {
        pane.style.display = "none";
        pane.classList.remove("active");
      });

      const activePane = document.getElementById(`pane-${paneId}`);
      if (activePane) {
        activePane.style.display = "flex";
        activePane.classList.add("active");
      }
    };
  }
}

function syncMetrics() {
  const dramasCountEl = document.getElementById("metric-total-dramas");
  const episodesCountEl = document.getElementById("metric-total-episodes");
  const issuesCountEl = document.getElementById("metric-pending-issues");
  const catalogCountEl = document.getElementById("admin-catalog-count");

  let totalEpisodes = 0;
  DRAMA_CATALOG.forEach((d) => {
    totalEpisodes += (d.episodes ? d.episodes.length : 0);
  });

  if (dramasCountEl) dramasCountEl.textContent = DRAMA_CATALOG.length.toString();
  if (episodesCountEl) episodesCountEl.textContent = totalEpisodes.toString();
  if (catalogCountEl) catalogCountEl.textContent = `${DRAMA_CATALOG.length} Registered Dramas`;

  const flagged = DRAMA_CATALOG.filter((d) => d.status === "flagged" || d.status === "pending").length;
  if (issuesCountEl) issuesCountEl.textContent = flagged.toString();
}

function renderDramaQueue() {
  const feed = document.getElementById("admin-dramas-feed");
  if (!feed) return;

  if (DRAMA_CATALOG.length === 0) {
    feed.innerHTML = `
      <div class="admin-empty-state">
        <span>🎬</span>
        <p>No drama series found in catalog.</p>
      </div>`;
    return;
  }

  feed.innerHTML = DRAMA_CATALOG.map((drama) => {
    const epCount = drama.episodes ? drama.episodes.length : 0;
    const status = drama.status || "approved";
    const currentSrc = (drama.episodes && drama.episodes[0] && drama.episodes[0].src) || "None";
    const posterImg = drama.posterUrl
      ? `<img src="${drama.posterUrl}" class="admin-thumb" alt="${drama.title}"/>`
      : `<div class="admin-thumb placeholder">🎬</div>`;

    return `
      <article class="admin-drama-row" data-series-id="${drama.id}">
        ${posterImg}
        <div class="admin-drama-info">
          <div class="admin-row-title-bar">
            <strong class="admin-drama-name">${drama.title}</strong>
            <span class="admin-status-tag status-${status}">${status.toUpperCase()}</span>
          </div>
          <span class="admin-drama-sub">${drama.genre || 'Drama'} • ${epCount} Episodes</span>
          <span class="admin-stream-preview-link">Stream: <code>${currentSrc.split('/').pop()}</code></span>
          <div class="admin-action-pill-row">
            <button class="btn-mod-action edit-stream" data-action="edit-stream" data-id="${drama.id}">Edit Stream 🎥</button>
            <button class="btn-mod-action preview" data-action="preview" data-id="${drama.id}">Watch ▶</button>
            <button class="btn-mod-action approve" data-action="approve" data-id="${drama.id}">Approve ✓</button>
            <button class="btn-mod-action delete" data-action="delete" data-id="${drama.id}">Delete ✕</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}
function attachStreamEditorEvents() {
  const modal = document.getElementById("admin-stream-modal");
  const closeBtn = document.getElementById("btn-close-stream-modal");
  const urlInput = document.getElementById("admin-video-url-input");
  const testBtn = document.getElementById("btn-test-stream-src");
  const saveBtn = document.getElementById("btn-save-stream-src");
  const previewVideo = document.getElementById("admin-preview-video");
  const testBadge = document.getElementById("video-test-badge");

  if (closeBtn) closeBtn.onclick = () => { if (modal) modal.style.display = "none"; if (previewVideo) previewVideo.pause(); };
  if (modal) modal.onclick = (e) => { if (e.target === modal) { modal.style.display = "none"; if (previewVideo) previewVideo.pause(); } };

  // Quick Prefix Buttons
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.onclick = () => {
      const prefix = btn.getAttribute("data-prefix");
      if (urlInput) {
        urlInput.value = `${R2_BASE}/${prefix}`;
        urlInput.focus();
      }
    };
  });

  // Verify Stream Playback
  if (testBtn) {
    testBtn.onclick = () => {
      const url = urlInput ? urlInput.value.trim() : "";
      if (!url) {
        showAppToast("Please enter a video URL first");
        return;
      }

      if (testBadge) testBadge.textContent = "Connecting to media stream...";
      if (previewVideo) {
        previewVideo.src = url;
        previewVideo.load();
        previewVideo.play().then(() => {
          if (testBadge) {
            testBadge.textContent = "Stream verified & playing smoothly! ✓";
            testBadge.style.color = "#27c93f";
          }
          showAppToast("Video verified: Stream Online ⚡");
        }).catch((err) => {
          if (testBadge) {
            testBadge.textContent = "Playback failed: Check file path or permissions";
            testBadge.style.color = "#ff2e63";
          }
          showAppToast("Error loading video stream");
        });
      }
    };
  }

  // Save and Publish Video Source
  if (saveBtn) {
    saveBtn.onclick = () => {
      const url = urlInput ? urlInput.value.trim() : "";
      if (!url) {
        showAppToast("Cannot save empty video URL");
        return;
      }

      const drama = DRAMA_CATALOG.find((d) => d.id === currentEditingSeriesId);
      if (drama && drama.episodes && drama.episodes[0]) {
        drama.episodes[0].src = url;
        saveCatalogToStorage();
        syncMetrics();
        renderDramaQueue();
        if (modal) modal.style.display = "none";
        if (previewVideo) previewVideo.pause();
        showAppToast(`Updated Episode 1 of "${drama.title}" successfully! 🚀`);
      }
    };
  }
}

function openStreamEditorModal(seriesId) {
  currentEditingSeriesId = seriesId;
  const drama = DRAMA_CATALOG.find((d) => d.id === seriesId);
  if (!drama) return;

  const modal = document.getElementById("admin-stream-modal");
  const modalSub = document.getElementById("modal-editing-title");
  const urlInput = document.getElementById("admin-video-url-input");
  const testBadge = document.getElementById("video-test-badge");
  const previewVideo = document.getElementById("admin-preview-video");

  const currentSrc = (drama.episodes && drama.episodes[0] && drama.episodes[0].src) || `${R2_BASE}/episodes/${drama.id}/`;

  if (modalSub) modalSub.textContent = `${drama.title} • Episode 1`;
  if (urlInput) urlInput.value = currentSrc;
  if (testBadge) {
    testBadge.textContent = "Ready to verify";
    testBadge.style.color = "rgba(255, 255, 255, 0.5)";
  }
  if (previewVideo) {
    previewVideo.removeAttribute("src");
    previewVideo.load();
  }

  if (modal) modal.style.display = "flex";
}

function attachAdminActions() {
  const dramasFeed = document.getElementById("admin-dramas-feed");

  if (dramasFeed) {
    dramasFeed.onclick = (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      const seriesId = btn.getAttribute("data-id");

      if (action === "edit-stream") {
        openStreamEditorModal(seriesId);
      } else if (action === "preview") {
        navigateTo("/series", { seriesId });
      } else if (action === "approve") {
        const drama = DRAMA_CATALOG.find((d) => d.id === seriesId);
        if (drama) {
          drama.status = "approved";
          saveCatalogToStorage();
          syncMetrics();
          renderDramaQueue();
          showAppToast(`"${drama.title}" marked as Approved ✓`);
        }
      } else if (action === "delete") {
        const idx = DRAMA_CATALOG.findIndex((d) => d.id === seriesId);
        if (idx >= 0) {
          DRAMA_CATALOG.splice(idx, 1);
          saveCatalogToStorage();
          syncMetrics();
          renderDramaQueue();
          showAppToast("Removed drama from catalog 🗑️");
        }
      }
    };
  }
}

function renderCreatorQueue() {
  const container = document.getElementById("admin-creators-list");
  if (!container) return;
  container.innerHTML = `
    <article class="admin-creator-card">
      <div class="creator-card-left">
        <span class="creator-avatar-bubble">🎬</span>
        <div><strong>Verified Studio Creator</strong><span class="creator-sub-tag">Coin Paywall Authorized ✓</span></div>
      </div>
    </article>
  `;
}

function renderCommentQueue() {
  const feed = document.getElementById("admin-comments-feed");
  if (!feed) return;
  feed.innerHTML = `
    <article class="admin-comment-card status-ok">
      <div class="comment-head"><strong>Viewer on The Dark Bees</strong><span class="comment-badge ok">APPROVED</span></div>
      <p class="comment-text-body">Loving this vertical format!</p>
    </article>
  `;
}
