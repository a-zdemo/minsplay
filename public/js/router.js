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

  // Hide bottom navigation on /watch so video fills 100% of viewport
  const bottomNav = document.querySelector(".bottom-nav") || document.querySelector("nav");
  if (bottomNav) {
    bottomNav.style.display = path === "/watch" ? "none" : "flex";
  }

  mainContent.innerHTML = html;
  window.scrollTo(0, 0);

  if (path === "/watch") {
    initPlayer(pendingEpisode);
  } else if (path === "/") {
    updateContinueWatching();
    initHomeInteractions();
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