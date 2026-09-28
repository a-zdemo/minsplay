import homeHtml from "../pages/home.html?raw";

const routes = {
  "/": homeHtml,
};

export async function loadPage(path) {
  const mainContent = document.getElementById("main-content");

  if (!mainContent) {
    console.error("Minsplay: #main-content not found.");
    return;
  }

  const html = routes[path];

  if (!html) {
    mainContent.innerHTML = `
      <section class="error-page">
        <h1>Page not found</h1>
        <p>The page you're looking for doesn't exist.</p>
      </section>
    `;
    return;
  }

  try {
    mainContent.innerHTML = html;
    console.log("Minsplay: Home page loaded successfully.");
  } catch (error) {
    console.error("Minsplay router error:", error);
    mainContent.innerHTML = `
      <section class="error-page">
        <h1>Something went wrong</h1>
        <p>${error.message}</p>
      </section>
    `;
  }
}

export function initRouter() {
  console.log("Minsplay: Router initializing...");

  const path = window.location.pathname || "/";

  loadPage(routes[path] ? path : "/");
}
