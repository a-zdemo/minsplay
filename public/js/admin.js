import { DRAMA_CATALOG, saveCatalogToStorage } from "./series-data.js";
import { showAppToast, navigateTo } from "./router.js";

const COMMENTS_KEY_PREFIX = "minsplay_comments_";

export function initAdminDashboard() {
  const tabsBar = document.getElementById("admin-nav-tabs");
  const refreshBtn = document.getElementById("btn-admin-refresh");

  syncMetrics();
  renderDramaQueue();
  renderCreatorQueue();
  renderCommentQueue();

  if (refreshBtn) {
    refreshBtn.onclick = () => {
      syncMetrics();
      renderDramaQueue();
      renderCreatorQueue();
      renderCommentQueue();
      showAppToast("Moderation feeds synced ✓");
    };
  }

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

  attachAdminActions();
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

  // Count unapproved/flagged items
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
          <span class="admin-drama-sub">${drama.genre || 'Drama'} • ${epCount} Episodes • ${drama.plays || '1'} Plays</span>
          <div class="admin-action-pill-row">
            <button class="btn-mod-action preview" data-action="preview" data-id="${drama.id}">Inspect ▶</button>
            <button class="btn-mod-action approve" data-action="approve" data-id="${drama.id}">Approve ✓</button>
            <button class="btn-mod-action flag" data-action="flag" data-id="${drama.id}">Flag ⚠</button>
            <button class="btn-mod-action delete" data-action="delete" data-id="${drama.id}">Delete ✕</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}
function renderCreatorQueue() {
  const container = document.getElementById("admin-creators-list");
  if (!container) return;

  container.innerHTML = `
    <article class="admin-creator-card">
      <div class="creator-card-left">
        <span class="creator-avatar-bubble">🐜</span>
        <div>
          <strong>Minsplay Studio Creator</strong>
          <span class="creator-sub-tag">Account ID: 84920 • Tier 1 Rookie</span>
        </div>
      </div>
      <div class="creator-stats-summary">
        <span>Plays: 28 / 100</span>
        <span class="badge-upgrade-eligibility">Eligible for Tier 2 Partner</span>
      </div>
      <div class="creator-actions-row">
        <button class="btn-mod-action approve" id="btn-promote-creator">Promote to Tier 2 Partner 👑</button>
      </div>
    </article>
  `;

  const promoteBtn = document.getElementById("btn-promote-creator");
  if (promoteBtn) {
    promoteBtn.onclick = () => {
      showAppToast("Creator promoted to Tier 2 Partner! Coin paywall authorized.");
      promoteBtn.textContent = "Verified Partner ✓";
      promoteBtn.disabled = true;
    };
  }
}

function renderCommentQueue() {
  const feed = document.getElementById("admin-comments-feed");
  if (!feed) return;

  const mockComments = [
    { id: "c_1", user: "Viewer_88", drama: "The Dark Bees", text: "Best cliffhanger yet! Watch till the end 🔥", status: "ok" },
    { id: "c_2", user: "SpamBot_99", drama: "The Dark Bees", text: "Click here to claim free crypto bonus -> bit.ly/xxx", status: "flagged" },
  ];

  feed.innerHTML = mockComments.map((c) => `
    <article class="admin-comment-card status-${c.status}">
      <div class="comment-head">
        <strong>${c.user} on <em>${c.drama}</em></strong>
        <span class="comment-badge ${c.status}">${c.status.toUpperCase()}</span>
      </div>
      <p class="comment-text-body">${c.text}</p>
      <div class="comment-mod-row">
        <button class="btn-mod-action delete" data-comment-id="${c.id}">Remove Comment 🗑️</button>
      </div>
    </article>
  `).join("");
}

function attachAdminActions() {
  const dramasFeed = document.getElementById("admin-dramas-feed");
  const testPingBtn = document.getElementById("btn-test-r2-ping");

  if (dramasFeed) {
    dramasFeed.onclick = (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      const seriesId = btn.getAttribute("data-id");
      const drama = DRAMA_CATALOG.find((d) => d.id === seriesId);
      if (!drama) return;

      if (action === "preview") {
        navigateTo("/series", { seriesId });
      } else if (action === "approve") {
        drama.status = "approved";
        saveCatalogToStorage();
        syncMetrics();
        renderDramaQueue();
        showAppToast(`"${drama.title}" marked as Approved ✓`);
      } else if (action === "flag") {
        drama.status = "flagged";
        saveCatalogToStorage();
        syncMetrics();
        renderDramaQueue();
        showAppToast(`"${drama.title}" flagged for compliance review ⚠`);
      } else if (action === "delete") {
        const idx = DRAMA_CATALOG.findIndex((d) => d.id === seriesId);
        if (idx >= 0) {
          DRAMA_CATALOG.splice(idx, 1);
          saveCatalogToStorage();
          syncMetrics();
          renderDramaQueue();
          showAppToast(`Removed "${drama.title}" from catalog 🗑️`);
        }
      }
    };
  }

  if (testPingBtn) {
    testPingBtn.onclick = async () => {
      showAppToast("Testing Cloudflare R2 presigned connectivity...");
      try {
        const res = await fetch("https://lekmsvdbthupiauejffo.supabase.co/functions/v1/smart-responder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: "ping.mp4", contentType: "video/mp4", seriesId: "admin-check" })
        });
        if (res.ok) showAppToast("Cloudflare R2 Gateway Online: HTTP 200 ✓");
        else showAppToast(`Signer error: HTTP ${res.status}`);
      } catch (err) {
        showAppToast("Ping Failed: Network check required");
      }
    };
  }
}
