import { showAppToast, navigateTo } from "./router.js";
import { getAllProgress, clearAllProgress, addCoins } from "./storage.js";
import { DRAMA_CATALOG } from "./series-data.js";

let selectedHistoryIds = new Set();
let isHistoryEditMode = false;

export function initProfileSubpages() {
  document.addEventListener("click", (e) => {
    // 1. Redeem Code Action in Gifts (Pic 4)
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

    // 2. Rules pill in Rewards (Pic 2)
    if (e.target.closest("#btn-rewards-rules")) {
      showAppToast("Earn points daily to extend your VIP membership!");
      return;
    }

    // 3. Redeem Cards in Rewards
    const redeemCard = e.target.closest(".db-redeem-card");
    if (redeemCard) {
      showAppToast("Subscribe to VIP to unlock point redemption ⚡");
      return;
    }

    // 4. History Edit Mode Toggle (Pics 5, 6, 7)
    if (e.target.closest("#btn-history-edit-mode")) {
      toggleHistoryEditMode(true);
      return;
    }
    if (e.target.closest("#btn-history-cancel")) {
      toggleHistoryEditMode(false);
      return;
    }

    // 5. Select Item in History Edit Mode
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

    // 6. Remove Selected Items from History
    if (e.target.closest("#btn-history-remove") && selectedHistoryIds.size > 0) {
      clearAllProgress();
      showAppToast(`Removed ${selectedHistoryIds.size} drama records 🗑️`);
      selectedHistoryIds.clear();
      toggleHistoryEditMode(false);
      renderHistoryFeed();
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
