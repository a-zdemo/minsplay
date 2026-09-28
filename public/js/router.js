import homeHtml from "../pages/home.html?raw";
import seriesHtml from "../pages/series.html?raw";
import watchHtml from "../pages/watch.html?raw";
import { initPlayer } from "./player.js";
import { getAllProgress } from "./storage.js";

const routes = {
  "/": homeHtml,
  "/series": seriesHtml,
  "/watch": watchHtml,
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
  const container = document.getElementById("continue-watching-list");
  if (!container) return;

  const records = getAllProgress();
  if (records.length === 0) return;

  container.innerHTML = records
    .map(
      (rec) => `
      <article class="series-card" data-route="/watch" data-episode="${rec.episodeId}">
        <div class="series-card-poster" style="position: relative;">
          <span>▶ Play</span>
          <div class="progress-bar-track" style="position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: rgba(255,255,255,0.2);">
            <div class="progress-bar-fill" style="width: ${rec.percentage}%; height: 100%; background: #ff2e63;"></div>
          </div>
        </div>
        <div class="series-card-info">
          <h3 class="series-card-title">${rec.seriesTitle}</h3>
          <p class="series-card-meta">${rec.episodeTitle} • ${rec.percentage}%</p>
        </div>
      </article>
    `
    )
    .join("");
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

  mainContent.innerHTML = html;
  window.scrollTo(0, 0);

  if (path === "/watch") {
    initPlayer(pendingEpisode);
  } else if (path === "/") {
    updateContinueWatching();
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
