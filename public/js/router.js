import homeHtml from "../pages/home.html?raw";
import seriesHtml from "../pages/series.html?raw";
import watchHtml from "../pages/watch.html?raw";
import mylistHtml from "../pages/mylist.html?raw";
import { initPlayer } from "./player.js";
import { getAllProgress } from "./storage.js";

const routes = {
  "/": homeHtml,
  "/series": seriesHtml,
  "/watch": watchHtml,
  "/mylist": mylistHtml,
};

let pendingEpisode = 1;

export async function navigateTo(path, episode = 1) {
  pendingEpisode = episode;
  if (window.location.pathname !== path) {
    window.history.pushState({ path, episode }, "", path);
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
      <article class="continue-card" data-route="/watch" data-episode="${rec.episodeId}">
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

function initMyListScreen() {
  const tabBar = document.getElementById("mylist-tab-bar");
  const historyList = document.getElementById("history-drama-list");

  // Render History Tab dynamically from storage
  if (historyList) {
    const records = getAllProgress();
    if (!records || records.length === 0) {
      historyList.innerHTML = `
        <div class="mylist-empty-state">
          <span class="empty-icon">📺</span>
          <p class="empty-text">No watch history yet. Start watching an episode!</p>
          <button class="btn-spotlight-play" type="button" data-route="/watch" data-episode="1">
            ▶ Watch Ep 1 Free
          </button>
        </div>
      `;
    } else {
      historyList.innerHTML = records
        .map(
          (rec) => `
          <article class="mylist-card" data-route="/watch" data-episode="${rec.episodeId}">
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
              <p class="mylist-ep-info">EP.${rec.episodeId} / EP.5</p>
            </div>
          </article>
        `
        )
        .join("");
    }
  }

  // Handle Tab Switching: Following vs History vs Reminder Set
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

  // Hide bottom nav on /watch for full-bleed player
  const bottomNav = document.getElementById("bottom-nav");
  if (bottomNav) {
    bottomNav.style.display = path === "/watch" ? "none" : "flex";
  }

  mainContent.innerHTML = html;
  window.scrollTo(0, 0);

  updateBottomNavActive(path);

  if (path === "/watch") {
    initPlayer(pendingEpisode);
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
      const episode = epAttr ? parseInt(epAttr, 10) : 1;
      navigateTo(targetRoute, episode);
    }
  });

  window.addEventListener("popstate", (e) => {
    const currentPath = window.location.pathname || "/";
    const ep = e.state && e.state.episode ? e.state.episode : 1;
    pendingEpisode = ep;
    renderRoute(routes[currentPath] ? currentPath : "/");
  });

  const initialPath = window.location.pathname || "/";
  renderRoute(routes[initialPath] ? initialPath : "/");
}


