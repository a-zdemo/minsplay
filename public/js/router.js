import homeHtml from "../pages/home.html?raw";
import seriesHtml from "../pages/series.html?raw";
import watchHtml from "../pages/watch.html?raw";
import mylistHtml from "../pages/mylist.html?raw";
import memberHtml from "../pages/member.html?raw";
import profileHtml from "../pages/profile.html?raw";
import foryouHtml from "../pages/foryou.html?raw";
import inboxHtml from "../pages/inbox.html?raw";
import settingsHtml from "../pages/settings.html?raw";
import walletHtml from "../pages/wallet.html?raw";
import { initPlayer } from "./player.js";
import { initForYouFeed, destroyForYouFeed } from "./foryou.js";
import {
  getAllProgress,
  clearAllProgress,
  isEpisodeUnlocked,
  getUserCoins,
  spendCoins,
  getCheckinData,
  claimDailyReward,
  getVipData,
  activateVip,
  getUserSettings,
  saveUserSetting
} from "./storage.js";
import { DRAMA_CATALOG, getSeriesById } from "./series-data.js";

const RECENT_SEARCHES_KEY = "minsplay_recent_searches";

const routes = {
  "/": homeHtml,
  "/foryou": foryouHtml,
  "/series": seriesHtml,
  "/watch": watchHtml,
  "/mylist": mylistHtml,
  "/member": memberHtml,
  "/profile": profileHtml,
  "/inbox": inboxHtml,
  "/settings": settingsHtml,
  "/wallet": walletHtml,
};

let currentActiveSeriesId = "the-beginning";
let pendingEpisode = 1;

export function showAppToast(message) {
  let toast = document.getElementById("app-floating-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "app-floating-toast";
    toast.className = "app-toast-pill";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("visible");
  setTimeout(() => {
    toast.classList.remove("visible");
  }, 2400);
}

export async function navigateTo(path, { seriesId, episode = 1 } = {}) {
  if (seriesId) currentActiveSeriesId = seriesId;
  pendingEpisode = episode;

  let targetUrl = path;
  const params = new URLSearchParams();
  if (currentActiveSeriesId && currentActiveSeriesId !== "the-beginning") {
    params.set("id", currentActiveSeriesId);
  }
  if (path === "/watch" && episode > 1) {
    params.set("ep", episode);
  }
  const queryString = params.toString();
  if (queryString) targetUrl += `?${queryString}`;

  if (window.location.pathname + window.location.search !== targetUrl) {
    window.history.pushState({ path, seriesId: currentActiveSeriesId, episode }, "", targetUrl);
  }
  await renderRoute(path);
}

function createDramaCardMarkup(drama, rankNumber = null) {
  let rankBadgeHtml = "";
  if (rankNumber !== null) {
    let rankClass = "rank-pill-other";
    if (rankNumber === 1) rankClass = "rank-pill-1";
    else if (rankNumber === 2) rankClass = "rank-pill-2";
    else if (rankNumber === 3) rankClass = "rank-pill-3";
    rankBadgeHtml = `<span class="poster-rank-badge ${rankClass}">${rankNumber}</span>`;
  }

  let statusBadgeHtml = "";
  if (drama.badge && rankNumber === null) {
    statusBadgeHtml = `<span class="poster-badge ${drama.badgeClass}">${drama.badge}</span>`;
  }

  return `
    <article class="drama-card" data-route="/series" data-series="${drama.id}">
      <div class="drama-poster-wrap">
        <div class="poster-gradient-art ${drama.artClass}">
          <span class="art-symbol">${drama.artSymbol}</span>
          <span class="art-code">${drama.artCode}</span>
        </div>
        ${rankBadgeHtml}
        ${statusBadgeHtml}
        <div class="poster-play-count">
          <span class="play-arrow">▶</span> ${drama.plays}
        </div>
      </div>
      <h3 class="drama-title">${drama.title}</h3>
      <p class="drama-genre">${drama.genre}</p>
    </article>
  `;
}

function updateContinueWatching() {
  const section = document.getElementById("continue-watching-section");
  const container = document.getElementById("continue-watching-list");
  if (!container || !section) return;

  const records = getAllProgress();
  if (!records || records.length === 0) {
    section.style.display = "none";
    return;
  }

  section.style.display = "flex";
  container.innerHTML = records
    .map(
      (rec) => `
      <article class="continue-card" data-route="/watch" data-series="${rec.seriesId}" data-episode="${rec.episodeId}">
        <div class="continue-poster">
          <span style="font-size: 0.72rem; font-weight: 700; color: #fff;">▶ Ep ${rec.episodeId}</span>
          <div class="continue-progress-bar">
            <div class="continue-progress-fill" style="width: ${rec.percentage}%;"></div>
          </div>
        </div>
        <h4 class="drama-title" style="margin-top: 4px; font-size: 0.75rem;">${rec.seriesTitle}</h4>
        <p class="drama-genre">${rec.episodeTitle} • ${rec.percentage}%</p>
      </article>
    `
    )
    .join("");
}

function initDailyGiftSystem() {
  const giftBtn = document.getElementById("btn-gift-modal");
  const giftModal = document.getElementById("daily-gift-modal");
  const closeBtn = document.getElementById("btn-close-gift-modal");
  const claimBtn = document.getElementById("btn-claim-daily-reward");
  const gridContainer = document.getElementById("streak-grid-7days");
  const notifDot = document.getElementById("gift-notification-dot");
  const coinPill = document.getElementById("header-coin-pill");
  const coinCount = document.getElementById("header-coin-count");

  function syncCoinDisplay() {
    if (coinCount) coinCount.textContent = getUserCoins().toString();
    const checkin = getCheckinData();
    if (notifDot) notifDot.style.display = checkin.claimedToday ? "none" : "block";
  }

  syncCoinDisplay();
  window.addEventListener("coinsUpdated", () => syncCoinDisplay());

  function renderStreakGrid() {
    if (!gridContainer) return;
    const { streak, claimedToday } = getCheckinData();
    const rewards = [20, 30, 40, 50, 60, 80, 100];

    let html = "";
    for (let day = 1; day <= 6; day++) {
      const isClaimed = day <= streak;
      const isToday = !claimedToday && day === streak + 1;
      let stateClass = isClaimed ? "claimed" : (isToday ? "active-today" : "");
      let checkIcon = isClaimed ? "✓" : "🪙";

      html += `
        <div class="streak-card ${stateClass}">
          <span class="streak-day-label">Day ${day}</span>
          <span class="streak-icon-wrap">${checkIcon}</span>
          <span class="streak-coin-val">+${rewards[day - 1]}</span>
        </div>
      `;
    }

    const isDay7Claimed = streak >= 7;
    const isDay7Today = !claimedToday && streak === 6;
    html += `
      <div class="streak-card super-day ${isDay7Claimed ? "claimed" : ""} ${isDay7Today ? "active-today" : ""}">
        <div class="super-day-left">
          <span style="font-size: 1.8rem;">🏆</span>
          <div>
            <span class="streak-day-label" style="color: #ffc107;">Day 7 Super Chest</span>
            <div style="font-size: 0.74rem; color: rgba(255,255,255,0.7);">Mega reward package</div>
          </div>
        </div>
        <span class="streak-coin-val" style="font-size: 0.95rem; font-weight: 900;">+100 Coins</span>
      </div>
    `;

    gridContainer.innerHTML = html;
    if (claimBtn) {
      claimBtn.disabled = claimedToday;
      claimBtn.textContent = claimedToday ? "Claimed Today ✓" : "Claim Today's Reward 🎁";
    }
  }

  function openGiftModal() { if (giftModal) { renderStreakGrid(); giftModal.style.display = "flex"; } }
  function closeGiftModal() { if (giftModal) giftModal.style.display = "none"; }

  if (giftBtn) giftBtn.onclick = openGiftModal;
  if (coinPill) coinPill.onclick = openGiftModal;
  if (closeBtn) closeBtn.onclick = closeGiftModal;
  if (giftModal) giftModal.onclick = (e) => { if (e.target === giftModal) closeGiftModal(); };

  if (claimBtn) {
    claimBtn.onclick = () => {
      const res = claimDailyReward();
      if (res.success) {
        syncCoinDisplay();
        renderStreakGrid();
        showAppToast(`🎁 Claimed +${res.reward} Coins! Streak: Day ${res.streak}`);
      }
    };
  }
}

function initHomeFilterSystem() {
  const subNav = document.getElementById("home-sub-nav");
  const chipsBar = document.getElementById("category-chips-bar");
  const grid = document.getElementById("home-drama-grid");
  const heading = document.getElementById("grid-section-heading");
  const countBadge = document.getElementById("grid-count-badge");
  const spotlightCard = document.getElementById("home-spotlight-card");
  const homeScrollBody = document.getElementById("home-scroll-body");

  if (!grid || !subNav) return;

  function renderGrid(dramas, isRanked = false) {
    grid.innerHTML = dramas.map((d, idx) => createDramaCardMarkup(d, isRanked ? idx + 1 : null)).join("");
    if (countBadge) countBadge.textContent = `${dramas.length} Titles`;
  }

  renderGrid(DRAMA_CATALOG);

  subNav.addEventListener("click", (e) => {
    const tabBtn = e.target.closest(".tab-item");
    if (!tabBtn) return;

    subNav.querySelectorAll(".tab-item").forEach((btn) => btn.classList.remove("active"));
    tabBtn.classList.add("active");

    const tab = tabBtn.getAttribute("data-tab");
    if (chipsBar) {
      const isCategories = tab === "categories";
      chipsBar.style.display = isCategories ? "flex" : "none";
      if (homeScrollBody) homeScrollBody.classList.toggle("with-chips", isCategories);
    }
    if (spotlightCard) spotlightCard.style.display = tab === "popular" ? "block" : "none";

    switch (tab) {
      case "popular":
        if (heading) heading.textContent = "Popular Series";
        renderGrid(DRAMA_CATALOG);
        break;
      case "new":
        if (heading) heading.textContent = "New Releases";
        renderGrid(DRAMA_CATALOG.filter((d) => d.badge === "New" || d.id === "bastard-hit-daughter" || d.id === "fake-husband"));
        break;
      case "rankings":
        if (heading) heading.textContent = "Top Rankings";
        const ranked = [...DRAMA_CATALOG].sort((a, b) => {
          const valA = a.plays.includes("M") ? parseFloat(a.plays) * 1000000 : parseFloat(a.plays) * 1000;
          const valB = b.plays.includes("M") ? parseFloat(b.plays) * 1000000 : parseFloat(b.plays) * 1000;
          return valB - valA;
        });
        renderGrid(ranked, true);
        break;
      case "categories":
        if (heading) heading.textContent = "Category Catalog";
        renderGrid(DRAMA_CATALOG);
        break;
      case "anime":
        if (heading) heading.textContent = "Action & Fantasy Dramas";
        renderGrid(DRAMA_CATALOG.filter((d) => d.genre.includes("Revenge") || d.genre.includes("Identity") || d.tags.includes("Martial") || d.id.includes("dragon")));
        break;
      case "vip":
        if (heading) heading.textContent = "VIP Exclusives";
        renderGrid(DRAMA_CATALOG.filter((d) => d.badge === "Hot" || d.plays.includes("M")));
        break;
      case "original":
        if (heading) heading.textContent = "Original+ Series";
        renderGrid(DRAMA_CATALOG.filter((d) => d.artCode === "ORIGINAL" || d.badge === "Following"));
        break;
      default:
        renderGrid(DRAMA_CATALOG);
    }
  });

  if (chipsBar) {
    chipsBar.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip-item");
      if (!chip) return;
      chipsBar.querySelectorAll(".chip-item").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      const genre = chip.getAttribute("data-genre");
      if (genre === "all") {
        if (heading) heading.textContent = "All Categories";
        renderGrid(DRAMA_CATALOG);
      } else {
        if (heading) heading.textContent = `${genre} Dramas`;
        renderGrid(DRAMA_CATALOG.filter((d) => d.genre.toLowerCase().includes(genre.toLowerCase()) || d.tags.toLowerCase().includes(genre.toLowerCase())));
      }
    });
  }
}

function initSearchOverlayEngine() {
  const searchPill = document.getElementById("home-search-pill");
  const overlay = document.getElementById("search-overlay");
  const input = document.getElementById("search-query-input");
  const clearBtn = document.getElementById("search-clear-btn");
  const cancelBtn = document.getElementById("search-cancel-btn");
  const hotShelf = document.getElementById("hot-search-shelf");
  const recentShelf = document.getElementById("recent-search-shelf");
  const recentTagsList = document.getElementById("recent-tags-list");
  const resultsBlock = document.getElementById("search-results-block");
  const resultsGrid = document.getElementById("search-results-grid");
  const resultsTitle = document.getElementById("results-count-title");
  const emptyState = document.getElementById("search-empty-state");
  const emptyDesc = document.getElementById("search-empty-desc");
  const clearRecentBtn = document.getElementById("btn-clear-recent");

  if (!searchPill || !overlay || !input) return;

  function getRecentSearches() {
    try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]"); } catch { return []; }
  }

  function saveRecentSearch(term) {
    const trimmed = term.trim();
    if (!trimmed) return;
    let recents = getRecentSearches().filter((t) => t.toLowerCase() !== trimmed.toLowerCase());
    recents.unshift(trimmed);
    if (recents.length > 8) recents = recents.slice(0, 8);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recents));
    renderRecentSearches();
  }

  function renderRecentSearches() {
    const recents = getRecentSearches();
    if (!recentShelf || !recentTagsList) return;
    if (recents.length === 0) {
      recentShelf.style.display = "none";
      return;
    }
    recentShelf.style.display = "flex";
    recentTagsList.innerHTML = recents
      .map((term) => `
        <button class="search-tag-chip recent-chip" type="button" data-search-term="${term}">
          <span>${term}</span>
          <span class="recent-chip-remove" data-remove-term="${term}">✕</span>
        </button>
      `).join("");
  }

  function executeSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      if (clearBtn) clearBtn.style.display = "none";
      if (resultsBlock) resultsBlock.style.display = "none";
      if (emptyState) emptyState.style.display = "none";
      if (hotShelf) hotShelf.style.display = "flex";
      renderRecentSearches();
      return;
    }

    if (clearBtn) clearBtn.style.display = "block";
    if (hotShelf) hotShelf.style.display = "none";
    if (recentShelf) recentShelf.style.display = "none";

    const matched = DRAMA_CATALOG.filter((drama) => {
      return (
        drama.title.toLowerCase().includes(q) ||
        drama.shortTitle.toLowerCase().includes(q) ||
        drama.synopsis.toLowerCase().includes(q) ||
        drama.genre.toLowerCase().includes(q) ||
        drama.tags.toLowerCase().includes(q)
      );
    });

    if (matched.length > 0) {
      if (emptyState) emptyState.style.display = "none";
      if (resultsBlock) resultsBlock.style.display = "flex";
      if (resultsTitle) resultsTitle.textContent = `Found ${matched.length} Drama${matched.length > 1 ? "s" : ""}`;
      if (resultsGrid) resultsGrid.innerHTML = matched.map((d) => createDramaCardMarkup(d)).join("");
    } else {
      if (resultsBlock) resultsBlock.style.display = "none";
      if (emptyState) {
        emptyState.style.display = "flex";
        if (emptyDesc) emptyDesc.textContent = `No dramas found for "${query}". Try searching "Dragon", "Revenge", or "Romance".`;
      }
    }
  }

  function openSearchOverlay() {
    overlay.style.display = "flex";
    renderRecentSearches();
    setTimeout(() => input.focus(), 100);
  }

  function closeSearchOverlay() {
    overlay.style.display = "none";
    input.value = "";
    executeSearch("");
  }

  searchPill.onclick = openSearchOverlay;
  if (cancelBtn) cancelBtn.onclick = closeSearchOverlay;
  if (clearBtn) {
    clearBtn.onclick = () => {
      input.value = "";
      input.focus();
      executeSearch("");
    };
  }

  input.addEventListener("input", (e) => executeSearch(e.target.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveRecentSearch(input.value);
      input.blur();
    }
  });

  const hotTagsList = document.getElementById("hot-tags-list");
  if (hotTagsList) {
    hotTagsList.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-tag]");
      if (chip) {
        const tag = chip.getAttribute("data-tag");
        input.value = tag;
        saveRecentSearch(tag);
        executeSearch(tag);
      }
    });
  }

  if (recentTagsList) {
    recentTagsList.addEventListener("click", (e) => {
      const removeBtn = e.target.closest("[data-remove-term]");
      if (removeBtn) {
        e.stopPropagation();
        const term = removeBtn.getAttribute("data-remove-term");
        let recents = getRecentSearches().filter((t) => t !== term);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recents));
        renderRecentSearches();
        return;
      }
      const chip = e.target.closest("[data-search-term]");
      if (chip) {
        const term = chip.getAttribute("data-search-term");
        input.value = term;
        executeSearch(term);
      }
    });
  }

  if (clearRecentBtn) {
    clearRecentBtn.onclick = () => {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      renderRecentSearches();
    };
  }
}

function initMemberScreen() {
  const plansContainer = document.getElementById("vip-plans-container");
  const coinBtn = document.getElementById("btn-activate-vip-coins");
  const cardBtn = document.getElementById("btn-activate-mock-pay");
  const statusIndicator = document.getElementById("vip-active-indicator");
  const expiryText = document.getElementById("vip-expiry-text");
  const balanceHint = document.getElementById("vip-wallet-balance-hint");

  let selectedPlan = "monthly";
  let selectedDays = 30;
  let selectedCoins = 600;
  let selectedPrice = "$8.99";

  function syncVipUI() {
    const vip = getVipData();
    const coins = getUserCoins();

    if (balanceHint) balanceHint.textContent = `🪙 ${coins} Coins Available`;
    if (statusIndicator) {
      if (vip.isVip) {
        statusIndicator.textContent = "VIP ACTIVE 👑";
        statusIndicator.classList.add("active");
      } else {
        statusIndicator.textContent = "FREE EXPLORER";
        statusIndicator.classList.remove("active");
      }
    }

    if (expiryText) {
      if (vip.isVip) {
        expiryText.style.display = "block";
        expiryText.textContent = `✓ Active Plan: ${vip.plan.toUpperCase()} • ${vip.daysLeft} days remaining`;
      } else {
        expiryText.style.display = "none";
      }
    }

    if (coinBtn) coinBtn.textContent = `🪙 Activate with ${selectedCoins} Coins`;
    if (cardBtn) cardBtn.textContent = `💳 Subscribe with Card (${selectedPrice})`;
  }

  syncVipUI();

  if (plansContainer) {
    plansContainer.addEventListener("click", (e) => {
      const card = e.target.closest(".vip-plan-card");
      if (!card) return;

      plansContainer.querySelectorAll(".vip-plan-card").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");

      selectedPlan = card.getAttribute("data-plan");
      selectedDays = parseInt(card.getAttribute("data-days"), 10);
      selectedCoins = parseInt(card.getAttribute("data-coins"), 10);
      selectedPrice = card.getAttribute("data-price");

      syncVipUI();
    });
  }

  if (coinBtn) {
    coinBtn.onclick = () => {
      const currentCoins = getUserCoins();
      if (currentCoins >= selectedCoins) {
        spendCoins(selectedCoins);
        activateVip(selectedPlan, selectedDays);
        showAppToast(`👑 VIP Pass Activated! (${selectedPlan.toUpperCase()} - ${selectedDays}d)`);
        syncVipUI();
      } else {
        showAppToast(`Need ${selectedCoins} 🪙! Current balance: ${currentCoins} 🪙`);
      }
    };
  }

  if (cardBtn) {
    cardBtn.onclick = () => {
      activateVip(selectedPlan, selectedDays);
      showAppToast(`💳 ${selectedPlan.toUpperCase()} Pass Subscribed (${selectedPrice})!`);
      syncVipUI();
    };
  }
}

function initProfileScreen() {
  const coinBal = document.getElementById("profile-coin-balance");
  const streakCount = document.getElementById("profile-streak-count");
  const crownBadge = document.getElementById("profile-vip-crown");
  const historyCount = document.getElementById("profile-history-count");
  const vipSummary = document.getElementById("profile-vip-summary");
  const checkinBtn = document.getElementById("btn-profile-checkin");

  function syncProfile() {
    const coins = getUserCoins();
    const checkin = getCheckinData();
    const vip = getVipData();
    const progressList = getAllProgress();

    if (coinBal) coinBal.textContent = coins.toString();
    if (streakCount) streakCount.textContent = `Day ${checkin.streak || 1} 🔥`;
    if (crownBadge) crownBadge.style.display = vip.isVip ? "block" : "none";
    if (historyCount) historyCount.textContent = `${progressList.length} In Progress`;
    if (vipSummary) vipSummary.textContent = vip.isVip ? `VIP Active (${vip.daysLeft}d)` : "Unlock VIP Pass";
  }

  syncProfile();

  if (checkinBtn) {
    checkinBtn.onclick = () => {
      const res = claimDailyReward();
      if (res.success) {
        showAppToast(`🎁 Claimed +${res.reward} Coins! Streak: Day ${res.streak}`);
        syncProfile();
      } else {
        showAppToast("Already claimed today's gift! Return tomorrow.");
      }
    };
  }
}

function initInboxScreen() {
  // Inbox subviews are managed by initInboxSubViews() in inbox.js
}

function initSettingsScreen() {
  const clearCacheBtn = document.getElementById("btn-settings-clear-cache");
  const clearHistoryBtn = document.getElementById("btn-settings-clear-history");
  const cacheSizeEl = document.getElementById("settings-cache-size");
  const guestResetBtn = document.getElementById("btn-guest-reset");
  const autoplayToggle = document.getElementById("setting-autoplay-next");
  const swipeToggle = document.getElementById("setting-swipe-gestures");
  const settings = getUserSettings();

  if (autoplayToggle) autoplayToggle.checked = settings.autoplayNext;
  if (swipeToggle) swipeToggle.checked = settings.swipeGestures;

  if (autoplayToggle) {
    autoplayToggle.onchange = () => {
      saveUserSetting("autoplayNext", autoplayToggle.checked);
      showAppToast(`Auto-Play: ${autoplayToggle.checked ? "Enabled" : "Disabled"}`);
    };
  }
  if (swipeToggle) {
    swipeToggle.onchange = () => {
      saveUserSetting("swipeGestures", swipeToggle.checked);
      showAppToast(`Swipe Gestures: ${swipeToggle.checked ? "Enabled" : "Disabled"}`);
    };
  }
  if (clearCacheBtn) {
    clearCacheBtn.onclick = () => {
      if ("caches" in window) {
        caches.keys().then((names) => names.forEach((name) => caches.delete(name)));
      }
      if (cacheSizeEl) cacheSizeEl.textContent = "0.0MB";
      showAppToast("App cache cleared 🗑️");
    };
  }
  if (clearHistoryBtn) {
    clearHistoryBtn.onclick = () => {
      clearAllProgress();
      showAppToast("Watch history cleared 🗑️");
    };
  }
  if (guestResetBtn) {
    guestResetBtn.onclick = () => {
      showAppToast("Guest session refreshed ✓");
      setTimeout(() => navigateTo("/"), 400);
    };
  }
}

function initWalletScreen() {
  const rewardCoinsEl = document.getElementById("wallet-reward-coins");
  const purchasedCoinsEl = document.getElementById("wallet-purchased-coins");
  const autoUnlockToggle = document.getElementById("setting-auto-unlock");
  const transRow = document.getElementById("btn-wallet-trans");
  const rewardsRow = document.getElementById("btn-wallet-rewards");
  const consumptionRow = document.getElementById("btn-wallet-consumption");

  const coins = getUserCoins();
  if (rewardCoinsEl) rewardCoinsEl.textContent = coins.toString();
  if (purchasedCoinsEl) purchasedCoinsEl.textContent = "0";

  const settings = getUserSettings();
  if (autoUnlockToggle) {
    autoUnlockToggle.checked = settings.autoUnlockNext !== false;
    autoUnlockToggle.onchange = () => {
      saveUserSetting("autoUnlockNext", autoUnlockToggle.checked);
      showAppToast(`Auto-unlock: ${autoUnlockToggle.checked ? "Enabled" : "Disabled"}`);
    };
  }

  if (transRow) transRow.onclick = () => showAppToast("No top-up transactions yet");
  if (rewardsRow) rewardsRow.onclick = () => showAppToast(`Current reward balance: ${coins} 🪙`);
  if (consumptionRow) consumptionRow.onclick = () => showAppToast("No coin consumption records");
}

function renderSeriesDetail(seriesId) {
  const drama = getSeriesById(seriesId);
  currentActiveSeriesId = drama.id;

  const titleEl = document.getElementById("series-title");
  const navTitleEl = document.getElementById("series-nav-title");
  const tagsEl = document.getElementById("series-tags");
  const statsEl = document.getElementById("series-stats");
  const synopsisEl = document.getElementById("series-synopsis");
  const badgeEl = document.getElementById("series-badge");
  const posterEl = document.getElementById("series-hero-poster");
  const startBtn = document.getElementById("btn-series-start-watch");
  const epCountEl = document.getElementById("series-episode-count");
  const epListEl = document.getElementById("series-episode-list");

  if (titleEl) titleEl.textContent = drama.title;
  if (navTitleEl) navTitleEl.textContent = drama.shortTitle || "Series Details";
  if (tagsEl) tagsEl.textContent = drama.tags;
  if (statsEl) statsEl.textContent = `${drama.episodes.length} Episodes • ${drama.plays} Plays`;
  if (synopsisEl) synopsisEl.textContent = drama.synopsis;

  if (badgeEl) {
    if (drama.badge) {
      badgeEl.textContent = drama.badge;
      badgeEl.style.display = "inline-block";
    } else {
      badgeEl.style.display = "none";
    }
  }

  if (posterEl) {
    posterEl.className = `series-hero-poster ${drama.artClass}`;
    posterEl.innerHTML = `<span style="font-size: 2.2rem;">${drama.artSymbol}</span>`;
  }

  if (startBtn) {
    startBtn.setAttribute("data-series", drama.id);
    startBtn.setAttribute("data-episode", "1");
  }

  if (epCountEl) epCountEl.textContent = `${drama.episodes.length} Total`;

  if (epListEl) {
    epListEl.innerHTML = drama.episodes
      .map((ep) => {
        const unlocked = isEpisodeUnlocked(drama.id, ep.id, ep.isFree);
        return `
          <article 
            class="episode-card ${unlocked ? "episode-free" : "episode-locked"}" 
            data-route="/watch" 
            data-series="${drama.id}" 
            data-episode="${ep.id}"
          >
            <div class="episode-index">${ep.id < 10 ? `0${ep.id}` : ep.id}</div>
            <div class="episode-info">
              <h3 class="episode-title">${ep.title}</h3>
              <p class="episode-duration">${ep.duration}</p>
            </div>
            <span class="status-tag ${unlocked ? "status-free" : "status-locked"}">
              ${unlocked ? (ep.isFree ? "FREE" : "UNLOCKED") : "🔒 LOCKED"}
            </span>
          </article>
        `;
      })
      .join("");
  }
}

function initMyListScreen() {
  const tabBar = document.getElementById("mylist-tab-bar");
  const historyList = document.getElementById("history-drama-list");

  if (historyList) {
    const records = getAllProgress();
    if (!records || records.length === 0) {
      historyList.innerHTML = `
        <div class="mylist-empty-state">
          <span class="empty-icon">📺</span>
          <p class="empty-text">No watch history yet. Start watching an episode!</p>
          <button class="btn-spotlight-play" type="button" data-route="/watch" data-series="the-beginning" data-episode="1">
            ▶ Watch Ep 1 Free
          </button>
        </div>
      `;
    } else {
      historyList.innerHTML = records
        .map(
          (rec) => `
          <article class="mylist-card" data-route="/watch" data-series="${rec.seriesId}" data-episode="${rec.episodeId}">
            <div class="mylist-poster-wrap">
              <div class="poster-gradient-art art-blue">
                <span class="art-symbol">▶</span>
              </div>
              <div class="mylist-card-progress-bar">
                <div class="mylist-card-progress-fill" style="width: ${rec.percentage}%;"></div>
              </div>
            </div>
            <div class="mylist-meta">
              <h3 class="mylist-title">${rec.seriesTitle}</h3>
              <p class="mylist-genre">${rec.episodeTitle} • ${rec.percentage}% complete</p>
              <p class="mylist-ep-info">EP.${rec.episodeId}</p>
            </div>
          </article>
        `
        )
        .join("");
    }
  }

  if (tabBar) {
    tabBar.addEventListener("click", (e) => {
      const tab = e.target.closest(".mylist-tab");
      if (!tab) return;

      const subtab = tab.getAttribute("data-subtab");
      tabBar.querySelectorAll(".mylist-tab").forEach((btn) => btn.classList.remove("active"));
      tab.classList.add("active");

      document.querySelectorAll(".mylist-tab-pane").forEach((pane) => {
        pane.classList.remove("active");
      });

      const activePane = document.getElementById(`pane-${subtab}`);
      if (activePane) activePane.classList.add("active");
    });
  }
}

function updateBottomNavActive(path) {
  const navItems = document.querySelectorAll(".bottom-nav .nav-item");
  navItems.forEach((btn) => {
    const route = btn.getAttribute("data-route");
    if (route === path) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

async function renderRoute(path) {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;

  if (path !== "/foryou") {
    destroyForYouFeed();
  }

  const html = routes[path];
  if (!html) {
    mainContent.innerHTML = `
      <section class="error-page" style="padding: 3rem 1.5rem; text-align: center;">
        <h1 style="color: #fff; margin-bottom: 0.5rem;">Page Not Found</h1>
        <button class="btn btn-primary" type="button" data-route="/">Return Home</button>
      </section>
    `;
    return;
  }

  const bottomNav = document.getElementById("bottom-nav");
  if (bottomNav) {
    // Hide bottom navigation on full player, settings, inbox, and wallet for full immersion
    bottomNav.style.display = (path === "/watch" || path === "/inbox" || path === "/settings" || path === "/wallet") ? "none" : "flex";
  }

  mainContent.innerHTML = html;
  window.scrollTo(0, 0);
  updateBottomNavActive(path);

  if (path === "/watch") {
    initPlayer(currentActiveSeriesId, pendingEpisode);
  } else if (path === "/foryou") {
    initForYouFeed();
  } else if (path === "/series") {
    renderSeriesDetail(currentActiveSeriesId);
  } else if (path === "/") {
    updateContinueWatching();
    initHomeFilterSystem();
    initSearchOverlayEngine();
    initDailyGiftSystem();
  } else if (path === "/mylist") {
    initMyListScreen();
  } else if (path === "/member") {
    initMemberScreen();
  } else if (path === "/profile") {
    initProfileScreen();
  } else if (path === "/inbox") {
    initInboxScreen();
  } else if (path === "/settings") {
    initSettingsScreen();
  } else if (path === "/wallet") {
    initWalletScreen();
  }
}

export function initRouter() {
  document.addEventListener("click", (e) => {
    const routeTrigger = e.target.closest("[data-route]");
    if (routeTrigger) {
      if (routeTrigger.id === "home-search-pill") return;

      e.preventDefault();
      const targetRoute = routeTrigger.getAttribute("data-route");
      const epAttr = routeTrigger.getAttribute("data-episode");
      const seriesAttr =
        routeTrigger.getAttribute("data-series") ||
        routeTrigger.getAttribute("data-series-id");

      const episode = epAttr ? parseInt(epAttr, 10) : 1;
      navigateTo(targetRoute, { seriesId: seriesAttr, episode });
    }
  });

  window.addEventListener("popstate", (e) => {
    const currentPath = window.location.pathname || "/";
    const urlParams = new URLSearchParams(window.location.search);
    const seriesId = (e.state && e.state.seriesId) || urlParams.get("id") || "the-beginning";
    const episode = (e.state && e.state.episode) || (urlParams.get("ep") ? parseInt(urlParams.get("ep"), 10) : 1);

    currentActiveSeriesId = seriesId;
    pendingEpisode = episode;
    renderRoute(routes[currentPath] ? currentPath : "/");
  });

  const initialPath = window.location.pathname || "/";
  const urlParams = new URLSearchParams(window.location.search);
  const initialSeries = urlParams.get("id") || "the-beginning";
  const initialEp = urlParams.get("ep") ? parseInt(urlParams.get("ep"), 10) : 1;

  currentActiveSeriesId = initialSeries;
  pendingEpisode = initialEp;

  renderRoute(routes[initialPath] ? initialPath : "/");
}
