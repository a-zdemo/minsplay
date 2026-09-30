import homeHtml from "../pages/home.html?raw";
import seriesHtml from "../pages/series.html?raw";
import watchHtml from "../pages/watch.html?raw";
import mylistHtml from "../pages/mylist.html?raw";
import { initPlayer } from "./player.js";
import { getAllProgress, isEpisodeUnlocked, getUserCoins, getCheckinData, claimDailyReward } from "./storage.js";
import { DRAMA_CATALOG, getSeriesById } from "./series-data.js";

const RECENT_SEARCHES_KEY = "minsplay_recent_searches";

// Member & Profile VIP Screens
const memberHtml = `
  <section class="page-container" style="padding: 2.5rem 1.25rem 5rem; text-align: center;">
    <div style="font-size: 3rem; margin-bottom: 0.5rem;">👑</div>
    <h1 style="font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">VIP Membership</h1>
    <p style="font-size: 0.88rem; color: rgba(255,255,255,0.65); line-height: 1.5; max-width: 300px; margin: 0 auto 1.5rem;">
      Enjoy full access to all drama series, ad-free streaming, and instant 4K releases.
    </p>
    <div style="background: linear-gradient(145deg, #181824, #101016); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 20px; max-width: 320px; margin: 0 auto 1.5rem; text-align: left;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-weight: 700; color: #fff;">Annual Pass</span>
        <span style="background: #ff2e63; color: #fff; font-size: 0.65rem; font-weight: 800; padding: 2px 6px; border-radius: 4px;">BEST VALUE</span>
      </div>
      <p style="margin: 0; font-size: 0.8rem; color: rgba(255,255,255,0.5);">Instant unlock for 500+ short drama episodes</p>
    </div>
    <button class="btn btn-primary" type="button" data-route="/" style="max-width: 320px; width: 100%;">
      Explore Popular Dramas
    </button>
  </section>
`;

const profileHtml = `
  <section class="page-container" style="padding: 2.5rem 1.25rem 5rem;">
    <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 2rem;">
      <div style="width: 60px; height: 60px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
        <img src="/icons/icon-animated.svg" alt="Minsplay Ant Mascot" style="width: 100%; height: 100%; object-fit: contain;" />
      </div>
      <div>
        <h2 style="font-size: 1.2rem; font-weight: 800; color: #fff; margin: 0 0 4px;">Minsplay Viewer</h2>
        <span style="background: rgba(255,46,99,0.2); color: #ff2e63; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 10px; border: 1px solid rgba(255,46,99,0.4);">Member ID #84920</span>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div class="episode-card" data-route="/mylist" style="justify-content: space-between;">
        <span style="font-weight: 600; color: #fff;">My Watch History</span>
        <span style="color: rgba(255,255,255,0.4);">›</span>
      </div>
      <div class="episode-card" data-route="/" style="justify-content: space-between;">
        <span style="font-weight: 600; color: #fff;">Account Preferences</span>
        <span style="color: rgba(255,255,255,0.4);">›</span>
      </div>
    </div>
  </section>
`;

const routes = {
  "/": homeHtml,
  "/series": seriesHtml,
  "/watch": watchHtml,
  "/mylist": mylistHtml,
  "/member": memberHtml,
  "/profile": profileHtml,
};

let currentActiveSeriesId = "the-beginning";
let pendingEpisode = 1;

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
  if (queryString) {
    targetUrl += `?${queryString}`;
  }

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

/* ==========================================================================
   Daily Gift 7-Day Streak & Coin System (Section 19)
   ========================================================================== */
function initDailyGiftSystem() {
  const giftBtn = document.getElementById("btn-gift-modal");
  const giftModal = document.getElementById("daily-gift-modal");
  const closeBtn = document.getElementById("btn-close-gift-modal");
  const claimBtn = document.getElementById("btn-claim-daily-reward");
  const gridContainer = document.getElementById("streak-grid-7days");
  const notifDot = document.getElementById("gift-notification-dot");
  const coinPill = document.getElementById("header-coin-pill");
  const coinCount = document.getElementById("header-coin-count");

  // Sync header coin balance
  function syncCoinDisplay() {
    if (coinCount) {
      coinCount.textContent = getUserCoins().toString();
    }
    const checkin = getCheckinData();
    if (notifDot) {
      notifDot.style.display = checkin.claimedToday ? "none" : "block";
    }
  }

  syncCoinDisplay();

  // Listen for global coin balance changes
  window.addEventListener("coinsUpdated", () => syncCoinDisplay());

  function renderStreakGrid() {
    if (!gridContainer) return;
    const { streak, claimedToday } = getCheckinData();
    const rewards = [20, 30, 40, 50, 60, 80, 100];
    const activeIndex = claimedToday ? -1 : streak % 7;

    let html = "";
    // Days 1 through 6
    for (let day = 1; day <= 6; day++) {
      const isClaimed = day <= (claimedToday ? streak : streak);
      const isToday = !claimedToday && day === streak + 1;
      let stateClass = "";
      let checkIcon = "🪙";

      if (isClaimed) {
        stateClass = "claimed";
        checkIcon = "✓";
      } else if (isToday) {
        stateClass = "active-today";
      }

      html += `
        <div class="streak-card ${stateClass}">
          <span class="streak-day-label">Day ${day}</span>
          <span class="streak-icon-wrap">${checkIcon}</span>
          <span class="streak-coin-val">+${rewards[day - 1]}</span>
        </div>
      `;
    }

    // Day 7 Super Bonus
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
      if (claimedToday) {
        claimBtn.disabled = true;
        claimBtn.textContent = "Claimed Today ✓";
      } else {
        claimBtn.disabled = false;
        claimBtn.textContent = "Claim Today's Reward 🎁";
      }
    }
  }

  function openGiftModal() {
    if (!giftModal) return;
    renderStreakGrid();
    giftModal.style.display = "flex";
  }

  function closeGiftModal() {
    if (!giftModal) return;
    giftModal.style.display = "none";
  }

  if (giftBtn) giftBtn.onclick = openGiftModal;
  if (coinPill) coinPill.onclick = openGiftModal;
  if (closeBtn) closeBtn.onclick = closeGiftModal;

  if (giftModal) {
    giftModal.onclick = (e) => {
      if (e.target === giftModal) closeGiftModal();
    };
  }

  if (claimBtn) {
    claimBtn.onclick = () => {
      const res = claimDailyReward();
      if (res.success) {
        syncCoinDisplay();
        renderStreakGrid();
      }
    };
  }
}

/**
 * Filter & Tab Logic for Home Screen (Section 15)
 */
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
      if (homeScrollBody) {
        homeScrollBody.classList.toggle("with-chips", isCategories);
      }
    }

    if (spotlightCard) {
      spotlightCard.style.display = tab === "popular" ? "block" : "none";
    }

    switch (tab) {
      case "popular":
        if (heading) heading.textContent = "Popular Series";
        renderGrid(DRAMA_CATALOG);
        break;

      case "new":
        if (heading) heading.textContent = "New Releases";
        const newDramas = DRAMA_CATALOG.filter((d) => d.badge === "New" || d.id === "bastard-hit-daughter" || d.id === "fake-husband");
        renderGrid(newDramas);
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
        const animeDramas = DRAMA_CATALOG.filter(
          (d) => d.genre.includes("Revenge") || d.genre.includes("Identity") || d.tags.includes("Martial") || d.id.includes("dragon")
        );
        renderGrid(animeDramas);
        break;

      case "vip":
        if (heading) heading.textContent = "VIP Exclusives";
        const vipDramas = DRAMA_CATALOG.filter((d) => d.badge === "Hot" || d.plays.includes("M"));
        renderGrid(vipDramas);
        break;

      case "original":
        if (heading) heading.textContent = "Original+ Series";
        const originals = DRAMA_CATALOG.filter((d) => d.artCode === "ORIGINAL" || d.badge === "Following");
        renderGrid(originals);
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
        const filtered = DRAMA_CATALOG.filter((d) => d.genre.toLowerCase().includes(genre.toLowerCase()) || d.tags.toLowerCase().includes(genre.toLowerCase()));
        renderGrid(filtered);
      }
    });
  }
}

/**
 * Instant Fuzzy Search Overlay Controller (Section 15)
 */
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
    try {
      return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
    } catch {
      return [];
    }
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
      .map(
        (term) => `
        <button class="search-tag-chip recent-chip" type="button" data-search-term="${term}">
          <span>${term}</span>
          <span class="recent-chip-remove" data-remove-term="${term}">✕</span>
        </button>
      `
      )
      .join("");
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
      if (resultsGrid) {
        resultsGrid.innerHTML = matched.map((d) => createDramaCardMarkup(d)).join("");
      }
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

  input.addEventListener("input", (e) => {
    executeSearch(e.target.value);
  });

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

  if (epCountEl) {
    epCountEl.textContent = `${drama.episodes.length} Total`;
  }

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
    bottomNav.style.display = path === "/watch" ? "none" : "flex";
  }

  mainContent.innerHTML = html;
  window.scrollTo(0, 0);

  updateBottomNavActive(path);

  if (path === "/watch") {
    initPlayer(currentActiveSeriesId, pendingEpisode);
  } else if (path === "/series") {
    renderSeriesDetail(currentActiveSeriesId);
  } else if (path === "/") {
    updateContinueWatching();
    initHomeFilterSystem();
    initSearchOverlayEngine();
    initDailyGiftSystem();
  } else if (path === "/mylist") {
    initMyListScreen();
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