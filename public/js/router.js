import homeHtml from "../pages/home.html?raw";
import seriesHtml from "../pages/series.html?raw";
import watchHtml from "../pages/watch.html?raw";
import mylistHtml from "../pages/mylist.html?raw";
import { initPlayer } from "./player.js";
import { getAllProgress, isEpisodeUnlocked } from "./storage.js";
import { getSeriesById } from "./series-data.js";

const routes = {
  "/": homeHtml,
  "/series": seriesHtml,
  "/watch": watchHtml,
  "/mylist": mylistHtml,
};

let currentActiveSeriesId = "the-beginning";
let pendingEpisode = 1;

export async function navigateTo(path, { seriesId, episode = 1 } = {}) {
  if (seriesId) currentActiveSeriesId = seriesId;
  pendingEpisode = episode;

  // Construct URL with query parameters for direct link sharing & refresh preservation
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

  // Initial load: parse URL parameters if opening directly or refreshing
  const initialPath = window.location.pathname || "/";
  const urlParams = new URLSearchParams(window.location.search);
  const initialSeries = urlParams.get("id") || "the-beginning";
  const initialEp = urlParams.get("ep") ? parseInt(urlParams.get("ep"), 10) : 1;

  currentActiveSeriesId = initialSeries;
  pendingEpisode = initialEp;

  renderRoute(routes[initialPath] ? initialPath : "/");
}