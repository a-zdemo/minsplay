import homeHtml from "../pages/home.html?raw";
import seriesHtml from "../pages/series.html?raw";

const routes = {
  "/": homeHtml,
  "/series": seriesHtml,
};

export async function navigateTo(path) {
  if (window.location.pathname !== path) {
    window.history.pushState(null, "", path);
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
        <p style="color: #888; margin-bottom: 1.5rem;">The requested screen could not be loaded.</p>
        <button class="btn btn-primary" type="button" data-route="/">Return Home</button>
      </section>
    `;
    return;
  }

  mainContent.innerHTML = html;
  window.scrollTo(0, 0);
  console.log(`Minsplay: Rendered route "${path}"`);
}

export function initRouter() {
  console.log("Minsplay: Initializing client-side router...");

  // Intercept global click events on data-route elements
  document.addEventListener("click", (e) => {
    const routeTrigger = e.target.closest("[data-route]");
    if (routeTrigger) {
      e.preventDefault();
      const targetRoute = routeTrigger.getAttribute("data-route");
      navigateTo(targetRoute);
    }
  });

  // Handle browser back/forward buttons
  window.addEventListener("popstate", () => {
    const currentPath = window.location.pathname || "/";
    renderRoute(routes[currentPath] ? currentPath : "/");
  });

  // Initial load
  const initialPath = window.location.pathname || "/";
  renderRoute(routes[initialPath] ? initialPath : "/");
}
