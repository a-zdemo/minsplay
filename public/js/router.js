import homeHtml from "../pages/home.html?raw";
import seriesHtml from "../pages/series.html?raw";
import watchHtml from "../pages/watch.html?raw";
import { initPlayer } from "./player.js";

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

async function renderRoute(path) {
  const mainContent = document.getElementById("main-content");
  if (!mainContent) {
    console.error("Minsplay: #main-content element not found.");
    return;
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

  mainContent.innerHTML = html;
  window.scrollTo(0, 0);

  // Hook screen-specific logic
  if (path === "/watch") {
    initPlayer(pendingEpisode);
  }

  console.log(`Minsplay: Rendered route "${path}"`);
}

export function initRouter() {
  console.log("Minsplay: Initializing client-side router...");

  // Intercept data-route clicks with optional data-episode
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
    const ep = (e.state && e.state.episode) ? e.state.episode : 1;
    pendingEpisode = ep;
    renderRoute(routes[currentPath] ? currentPath : "/");
  });

  const initialPath = window.location.pathname || "/";
  renderRoute(routes[initialPath] ? initialPath : "/");
}
