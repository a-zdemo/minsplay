import { showAppToast, navigateTo } from "./router.js";
import { getAllProgress, clearAllProgress, addCoins } from "./storage.js";
import { DRAMA_CATALOG } from "./series-data.js";
import {
  getAllDownloads,
  removeDownload,
  clearAllDownloads,
  getStorageEstimate
} from "./downloader.js";

let selectedHistoryIds = new Set();
let isHistoryEditMode = false;

export function initProfileSubpages() {
  document.addEventListener("click", (e) => {
    // 1. Redeem Code Action in Gifts
    if (e.target.closest("#btn-submit-gift")) {
      const input = document.getElementById("input-gift-code");
      const code = input ? input.value.trim().toUpperCase() : "";
      if (!code) {
        showAppToast("Please enter a redemption code");
        return;
      }
      if (code === "MINSPLAY2026" || code === "DRAMABOX" || code === "VIPGIFT") {
        addCoins(100);
        showAppToast("🎁 Redeemed +100 Reward Coins!");
        if (input) input.value = "";
      } else {
        showAppToast("Invalid or expired redemption code");
      }
      return;
    }

    if (e.target.closest("#btn-rewards-rules")) {
      showAppToast("Earn points daily to extend your VIP membership!");
      return;
    }

    const redeemCard = e.target.closest(".db-redeem-card");
    if (redeemCard) {
      showAppToast("Subscribe to VIP to unlock point redemption ⚡");
      return;
    }

    // 2. History Handlers
    if (e.target.closest("#btn-history-edit-mode")) {
      toggleHistoryEditMode(true);
      return;
    }
    if (e.target.closest("#btn-history-cancel")) {
      toggleHistoryEditMode(false);
      return;
    }

    const historyRow = e.target.closest(".db-history-row");
    if (historyRow && isHistoryEditMode) {
      const id = historyRow.getAttribute("data-history-id");
      const radio = historyRow.querySelector(".db-history-radio");
      if (selectedHistoryIds.has(id)) {
        selectedHistoryIds.delete(id);
        if (radio) { radio.classList.remove("selected"); radio.textContent = ""; }
      } else {
        selectedHistoryIds.add(id);
        if (radio) { radio.classList.add("selected"); radio.textContent = "✓"; }
      }
      syncRemoveBtnState();
      return;
    }

    if (e.target.closest("#btn-history-remove") && selectedHistoryIds.size > 0) {
      clearAllProgress();
      showAppToast(`Removed ${selectedHistoryIds.size} drama records 🗑️`);
      selectedHistoryIds.clear();
      toggleHistoryEditMode(false);
      renderHistoryFeed();
      return;
    }

    // 3. Download Handlers
    const dlCard = e.target.closest(".db-download-card");
    if (dlCard && !e.target.closest(".db-dl-delete-btn")) {
      const sId = dlCard.getAttribute("data-series-id");
      const epId = dlCard.getAttribute("data-episode-id") || 1;
      navigateTo("/watch", { seriesId: sId, episode: parseInt(epId, 10) });
      return;
    }

    const dlDeleteBtn = e.target.closest(".db-dl-delete-btn");
    if (dlDeleteBtn) {
      e.stopPropagation();
      const sId = dlDeleteBtn.getAttribute("data-series");
      const epId = dlDeleteBtn.getAttribute("data-ep");
      removeDownload(sId, epId).then(() => {
        showAppToast("Removed downloaded episode 🗑️");
        renderDownloadPage();
      });
      return;
    }

    if (e.target.closest("#btn-download-clear-all")) {
      clearAllDownloads().then(() => {
        showAppToast("Purged all offline cached videos 🗑️");
        renderDownloadPage();
      });
      return;
    }
  });
}

export function renderHistoryFeed() {
  const container = document.getElementById("history-feed-container");
  if (!container) return;

  const records = getAllProgress();
  if (records.length === 0) {
    container.innerHTML = `<div class="db-empty-desc" style="text-align: center; padding: 40px 0;">No watch history yet.</div>`;
    return;
  }

  container.innerHTML = records.map((rec) => {
    const drama = DRAMA_CATALOG.find((d) => d.id === rec.seriesId) || { badge: "Hot", genre: "Urban Suspense" };
    return `
      <article class="db-history-row" data-history-id="${rec.seriesId}" data-route="${isHistoryEditMode ? '' : '/watch'}" data-series="${rec.seriesId}" data-episode="${rec.episodeId}">
        <span class="db-history-radio" style="display: ${isHistoryEditMode ? 'grid' : 'none'};"></span>
        <div class="db-history-thumb art-blue">
          <span style="font-size: 1.1rem;">▶</span>
          <div class="continue-progress-bar"><div class="continue-progress-fill" style="width: ${rec.percentage}%;"></div></div>
        </div>
        <div class="db-history-meta">
          <h3 class="db-history-title">${rec.seriesTitle}</h3>
          <p class="db-history-genre">${drama.genre}</p>
          <span class="db-history-ep-text">EP.${rec.episodeId} / EP.5</span>
        </div>
      </article>
    `;
  }).join("");
}

export async function renderDownloadPage() {
  const container = document.getElementById("download-feed-container");
  const emptyState = document.getElementById("download-empty-state");
  const headingCount = document.getElementById("download-heading-count");
  const cachedText = document.getElementById("storage-cached-text");
  const availText = document.getElementById("storage-avail-text");

  if (!container) return;

  const downloads = getAllDownloads();
  const { cachedMb, availGb } = await getStorageEstimate();

  if (cachedText) cachedText.textContent = `${cachedMb}MB cached`;
  if (availText) availText.textContent = `${availGb}GB available remaining`;

  if (downloads.length === 0) {
    container.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    if (headingCount) headingCount.textContent = "Download completed (0)";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  if (headingCount) headingCount.textContent = `Download completed (${downloads.length})`;

  container.innerHTML = downloads.map((item) => {
    return `
      <article class="db-download-card" data-series-id="${item.seriesId}" data-episode-id="${item.episodeId}">
        <div class="db-download-thumb ${item.artClass}">
          <span class="db-download-ep-badge">Ep ${item.episodeId}</span>
          <span class="art-symbol">${item.artSymbol}</span>
        </div>
        <div class="db-download-meta">
          <strong class="db-download-title">${item.seriesTitle}</strong>
          <p class="db-download-desc">${item.episodeTitle}</p>
          <div class="db-download-footer-row">
            <span class="db-download-size">💾 ${item.sizeStr}</span>
            <button class="db-dl-delete-btn" data-series="${item.seriesId}" data-ep="${item.episodeId}" type="button" aria-label="Delete">🗑</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function toggleHistoryEditMode(enable) {
  isHistoryEditMode = enable;
  const normalHeader = document.getElementById("history-header-normal");
  const editHeader = document.getElementById("history-header-edit");
  const removeBar = document.getElementById("history-remove-bar");

  if (normalHeader && editHeader) {
    normalHeader.style.display = enable ? "none" : "flex";
    editHeader.style.display = enable ? "flex" : "none";
  }
  if (removeBar) removeBar.style.display = enable ? "flex" : "none";

  selectedHistoryIds.clear();
  syncRemoveBtnState();
  renderHistoryFeed();
}

function syncRemoveBtnState() {
  const btn = document.getElementById("btn-history-remove");
  if (!btn) return;
  const count = selectedHistoryIds.size;
  btn.disabled = count === 0;
  btn.classList.toggle("active", count > 0);
  btn.innerHTML = `<span>🗑</span> Remove ${count > 0 ? `(${count})` : ''}`;
}
