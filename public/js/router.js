
function renderProfilePage() {
  const user = getCurrentUser();
  const nameEl = document.getElementById("profile-display-name");
  const idEl = document.getElementById("profile-member-id");
  const coinEl = document.getElementById("profile-coin-balance");
  const creatorShelf = document.getElementById("profile-creator-shelf");
  const copyBtn = document.getElementById("btn-copy-id");

  let guestId = localStorage.getItem("minsplay_guest_id");
  if (!guestId) {
    guestId = Math.floor(100000000 + Math.random() * 900000000).toString();
    localStorage.setItem("minsplay_guest_id", guestId);
  }

  if (idEl) idEl.textContent = user.email ? (user.id || guestId) : guestId;
  if (nameEl) nameEl.textContent = user.email ? user.username : "Log in";
  if (coinEl) coinEl.textContent = getUserCoins().toString();
  if (creatorShelf) creatorShelf.style.display = (user.role === ROLES.CREATOR || user.role === ROLES.SUPER_ADMIN) ? "block" : "none";

  if (copyBtn) {
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      const textToCopy = idEl ? idEl.textContent : guestId;
      navigator.clipboard?.writeText(textToCopy);
      showAppToast(`ID ${textToCopy} copied to clipboard 📋`);
    };
  }
}

import { initMemberPage } from "./member.js";
import authHtml from "../pages/auth.html?raw";
import adminHtml from "../pages/admin.html?raw";
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
import rewardsHtml from "../pages/rewards.html?raw";
import eventsHtml from "../pages/events.html?raw";
import giftsHtml from "../pages/gifts.html?raw";
import historyHtml from "../pages/history.html?raw";
import downloadHtml from "../pages/download.html?raw";
import creatorHtml from "../pages/creator.html?raw";

import { initAuthPage } from "./auth-page.js";
import { initAdminDashboard } from "./admin.js";
import { initCreatorStudio } from "./creator.js";
import { initPlayer } from "./player.js";
import { initForYouFeed, destroyForYouFeed } from "./foryou.js";
import { renderHistoryFeed, renderDownloadPage } from "./profile-subpages.js";
import { canAccessRoute, getCurrentUser, ROLES } from "./auth.js";
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
  saveUserSetting,
} from "./storage.js";
import { DRAMA_CATALOG, getSeriesById } from "./series-data.js";

const RECENT_SEARCHES_KEY = "minsplay_recent_searches";

// ISSUE 9 FIX: Full route table including /admin and /auth
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
  "/rewards": rewardsHtml,
  "/events": eventsHtml,
  "/gifts": giftsHtml,
  "/history": historyHtml,
  "/download": downloadHtml,
  "/creator": creatorHtml,
  "/admin": adminHtml,
  "/auth": authHtml,
};

let currentActiveSeriesId = "";
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
  // ISSUE 3 FIX: Enforce 5-tier RBAC Route Guard on link clicks
  if (!canAccessRoute(path)) {
    const user = getCurrentUser();
    if (user.role === ROLES.GUEST) {
      showAppToast("Please sign in to access this area 🔐");
      navigateTo("/auth");
      return;
    } else {
      showAppToast(`Access Denied: ${user.role.toUpperCase()} cannot access ${path}`);
      return;
    }
  }

  if (seriesId) currentActiveSeriesId = seriesId;
  pendingEpisode = episode;

  let targetUrl = path;
  const params = new URLSearchParams();
  if (currentActiveSeriesId) params.set("id", currentActiveSeriesId);
  if (path === "/watch" && episode > 1) params.set("ep", episode);

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
    statusBadgeHtml = `<span class="poster-badge ${drama.badgeClass || 'badge-hot'}">${drama.badge}</span>`;
  }

  const posterInner = drama.posterUrl
    ? `<img src="${drama.posterUrl}" class="poster-real-img" alt="${drama.title}" />`
    : `
      <div class="poster-gradient-art ${drama.artClass || 'art-gold'}">
        <span class="art-symbol">${drama.artSymbol || '🎬'}</span>
        <span class="art-code">${drama.artCode || 'ORIGINAL'}</span>
      </div>`;

  return `
    <article class="drama-card" data-route="/series" data-series="${drama.id}">
      <div class="drama-poster-wrap">
        ${posterInner}
        ${rankBadgeHtml}
        ${statusBadgeHtml}
        <div class="poster-play-count">
          <span class="play-arrow">▶</span> ${drama.plays || '1'}
        </div>
      </div>
      <h3 class="drama-title">${drama.title}</h3>
      <p class="drama-genre">${drama.genre || 'Urban Drama'}</p>
    </article>
  `;
}
function updateContinueWatching() {
  const section = document.getElementById("continue-watching-section");
  const container = document.getElementById("continue-watching-list");
  if (!container || !section) return;

  const records = getAllProgress().filter((rec) =>
    DRAMA_CATALOG.some((d) => d.id === rec.seriesId)
  );

  if (!records || records.length === 0) {
    section.style.display = "none";
    return;
  }

  section.style.display = "flex";
  container.innerHTML = records.map((rec) => {
    const drama = DRAMA_CATALOG.find((d) => d.id === rec.seriesId);
    const thumbMarkup = drama && drama.posterUrl
      ? `<img src="${drama.posterUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" alt="${rec.seriesTitle}" />`
      : `<span style="font-size: 0.72rem; font-weight: 700; color: #fff;">▶ Ep ${rec.episodeId}</span>`;

    return `
      <article class="continue-card" data-route="/watch" data-series="${rec.seriesId}" data-episode="${rec.episodeId}">
        <div class="continue-poster">
          ${thumbMarkup}
          <div class="continue-progress-bar"><div class="continue-progress-fill" style="width: ${rec.percentage}%;"></div></div>
        </div>
        <h4 class="drama-title" style="margin-top: 4px; font-size: 0.75rem;">${rec.seriesTitle}</h4>
        <p class="drama-genre">${rec.episodeTitle} • ${rec.percentage}%</p>
      </article>
    `;
  }).join("");
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
  const countBadge = document.getElementById("grid-count-badge");
  const spotlightCard = document.getElementById("home-spotlight-card");
  const homeScrollBody = document.getElementById("home-scroll-body");

  if (!grid || !subNav) return;

  function renderGrid(dramas) {
    grid.innerHTML = dramas.map((d) => createDramaCardMarkup(d)).join("");
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
    renderGrid(DRAMA_CATALOG);
  });
}

function initSearchOverlayEngine() {
  const searchPill = document.getElementById("home-search-pill");
  const overlay = document.getElementById("search-overlay");
  const input = document.getElementById("search-query-input");
  const clearBtn = document.getElementById("search-clear-btn");
  const cancelBtn = document.getElementById("search-cancel-btn");
  const resultsBlock = document.getElementById("search-results-block");
  const resultsGrid = document.getElementById("search-results-grid");
  const emptyState = document.getElementById("search-empty-state");

  if (!searchPill || !overlay || !input) return;

  searchPill.onclick = () => { overlay.style.display = "flex"; input.focus(); };
  if (cancelBtn) cancelBtn.onclick = () => { overlay.style.display = "none"; input.value = ""; };
  if (clearBtn) clearBtn.onclick = () => { input.value = ""; input.focus(); };

  input.addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
      if (resultsBlock) resultsBlock.style.display = "none";
      if (emptyState) emptyState.style.display = "none";
      return;
    }
    const matched = DRAMA_CATALOG.filter((d) => d.title.toLowerCase().includes(q));
    if (matched.length > 0) {
      if (emptyState) emptyState.style.display = "none";
      if (resultsBlock) resultsBlock.style.display = "flex";
      if (resultsGrid) resultsGrid.innerHTML = matched.map((d) => createDramaCardMarkup(d)).join("");
    } else {
      if (resultsBlock) resultsBlock.style.display = "none";
      if (emptyState) emptyState.style.display = "flex";
    }
  });
}

function renderSeriesDetail(seriesId) {
  const drama = getSeriesById(seriesId);
  if (!drama) { navigateTo("/"); return; }
  currentActiveSeriesId = drama.id;

  const titleEl = document.getElementById("series-title");
  const epCountEl = document.getElementById("series-episode-count");
  const epListEl = document.getElementById("series-episode-list");
  const startBtn = document.getElementById("btn-series-start-watch");

  if (titleEl) titleEl.textContent = drama.title;
  if (epCountEl) epCountEl.textContent = `${drama.episodes ? drama.episodes.length : 1} Total`;
  if (startBtn) {
    startBtn.setAttribute("data-series", drama.id);
    startBtn.setAttribute("data-episode", "1");
  }

  if (epListEl && drama.episodes) {
    epListEl.innerHTML = drama.episodes.map((ep) => {
      const unlocked = isEpisodeUnlocked(drama.id, ep.id, ep.isFree);
      return `
        <article class="episode-card ${unlocked ? 'episode-free' : 'episode-locked'}" data-route="/watch" data-series="${drama.id}" data-episode="${ep.id}">
          <div class="episode-index">${ep.id < 10 ? `0${ep.id}` : ep.id}</div>
          <div class="episode-info"><h3 class="episode-title">${ep.title}</h3><p class="episode-duration">${ep.duration || '1m 30s'}</p></div>
          <span class="status-tag ${unlocked ? 'status-free' : 'status-locked'}">${unlocked ? (ep.isFree ? 'FREE' : 'UNLOCKED') : '🔒 LOCKED'}</span>
        </article>
      `;
    }).join("");
  }
}
function updateBottomNavActive(path) {
  const navItems = document.querySelectorAll(".bottom-nav .nav-item");
  navItems.forEach((btn) => {
    const route = btn.getAttribute("data-route");
    btn.classList.toggle("active", route === path);
  });
}

async function renderRoute(path) {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) return;

  // ISSUE 3 FIX: Enforce RBAC route protection on direct address bar / refresh / incognito
  if (!canAccessRoute(path)) {
    const user = getCurrentUser();
    if (user.role === ROLES.GUEST) {
      showAppToast("Please sign in to access this area 🔐");
      window.history.replaceState({ path: "/auth" }, "", "/auth");
      await renderRoute("/auth");
      return;
    } else {
      showAppToast(`Access Denied: ${user.role.toUpperCase()} cannot access ${path}`);
      window.history.replaceState({ path: "/" }, "", "/");
      await renderRoute("/");
      return;
    }
  }

  if (path !== "/foryou") destroyForYouFeed();

  const html = routes[path];
  if (!html) {
    mainContent.innerHTML = `<section class="error-page" style="padding: 3rem 1.5rem; text-align: center;"><h1 style="color: #fff;">Page Not Found</h1><button class="btn btn-primary" type="button" data-route="/">Return Home</button></section>`;
    return;
  }

  // Hide bottom nav on full-screen subpages, auth, and moderation
  const bottomNav = document.getElementById("bottom-nav");
  if (bottomNav) {
    const isSubpage = (
      path === "/watch" || path === "/inbox" || path === "/settings" ||
      path === "/wallet" || path === "/rewards" || path === "/events" ||
      path === "/gifts" || path === "/history" || path === "/download" || path === "/member" ||
      path === "/creator" || path === "/auth" || path === "/admin"
    );
    bottomNav.style.display = isSubpage ? "none" : "flex";
  }

  mainContent.innerHTML = html;
  window.scrollTo(0, 0);
  updateBottomNavActive(path);

  // Controller attachments
  if (path === "/watch") {
    const sId = currentActiveSeriesId || (DRAMA_CATALOG.length > 0 ? DRAMA_CATALOG[0].id : "");
    initPlayer(sId, pendingEpisode);
  } else if (path === "/foryou") {
    initForYouFeed();
  } else if (path === "/series") {
    renderSeriesDetail(currentActiveSeriesId);
  } else if (path === "/") {
    updateContinueWatching();
    initHomeFilterSystem();
    initSearchOverlayEngine();
    initDailyGiftSystem();
  } else if (path === "/history") {
    renderHistoryFeed();
  } else if (path === "/download") {
    renderDownloadPage();
  } else if (path === "/profile") {
    renderProfilePage();
  } else if (path === "/member") {
    initMemberPage();
  } else if (path === "/creator") {
    // ISSUE 8 FIX: Dedicated Creator Studio invocation
    initCreatorStudio();
  } else if (path === "/auth") {
    // ISSUES 4, 5, 6, 7 FIX: Dedicated Auth Page invocation
    initAuthPage();
  } else if (path === "/admin") {
    // ISSUE 9 FIX: Dedicated Admin Dashboard invocation
    initAdminDashboard();
  }
}

export function initRouter() {
  window.addEventListener("catalogUpdated", () => {
    const currentPath = window.location.pathname || "/";
    if (currentPath === "/series" && currentActiveSeriesId) {
      renderSeriesDetail(currentActiveSeriesId);
    }
  });

  document.addEventListener("click", (e) => {
    const routeTrigger = e.target.closest("[data-route]");
    if (routeTrigger) {
      if (routeTrigger.id === "home-search-pill") return;
      const targetRoute = routeTrigger.getAttribute("data-route");
      if (!targetRoute) return;
      e.preventDefault();
      const epAttr = routeTrigger.getAttribute("data-episode");
      const seriesAttr = routeTrigger.getAttribute("data-series") || routeTrigger.getAttribute("data-series-id");
      const episode = epAttr ? parseInt(epAttr, 10) : 1;
      navigateTo(targetRoute, { seriesId: seriesAttr, episode });
    }
  });

  window.addEventListener("popstate", (e) => {
    const currentPath = window.location.pathname || "/";
    const urlParams = new URLSearchParams(window.location.search);
    const seriesId = (e.state && e.state.seriesId) || urlParams.get("id") || "";
    const episode = (e.state && e.state.episode) || (urlParams.get("ep") ? parseInt(urlParams.get("ep"), 10) : 1);
    currentActiveSeriesId = seriesId;
    pendingEpisode = episode;
    renderRoute(routes[currentPath] ? currentPath : "/");
  });

  const initialPath = window.location.pathname || "/";
  const urlParams = new URLSearchParams(window.location.search);
  const initialSeries = urlParams.get("id") || (DRAMA_CATALOG.length > 0 ? DRAMA_CATALOG[0].id : "");
  const initialEp = urlParams.get("ep") ? parseInt(urlParams.get("ep"), 10) : 1;
  currentActiveSeriesId = initialSeries;
  pendingEpisode = initialEp;

  // ISSUE 3 FIX: Enforce route access right when app boots up
  renderRoute(routes[initialPath] ? initialPath : "/");
}
