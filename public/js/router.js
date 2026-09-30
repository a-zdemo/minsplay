import homeHtml from "../pages/home.html?raw";
import seriesHtml from "../pages/series.html?raw";
import watchHtml from "../pages/watch.html?raw";
import mylistHtml from "../pages/mylist.html?raw";
import { initPlayer } from "./player.js";
import { getAllProgress, isEpisodeUnlocked } from "./storage.js";
import { getSeriesById } from "./series-data.js";

// Member & Profile VIP Placeholders matching DramaBox dark aesthetic
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

function initHomeInteractions() {
  const subNav = document.getElementById("home-sub-nav");
  if (!subNav) return;

  subNav.addEventListener("click", (e) => {
    const tabBtn = e.target.closest(".tab-item");
    if (!tabBtn) return;
    subNav.querySelectorAll(".tab-item").forEach((btn) => btn.classList.remove("active"));
    tabBtn.classList.add("active");
  });
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
    // Only highlight if route directly matches path
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
    // Hide bottom nav on full-bleed player
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
    initHomeInteractions();
  } else if (path === "/mylist") {
    initMyListScreen();
  }
}

export function initRouter() {
  document.addEventListener("click", (e) => {
    const routeTrigger = e.target.closest("[data-route]");
    if (routeTrigger) {
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