import { initRouter } from "./router.js";

function startApp() {
  try {
    initRouter();
  } catch (error) {
    console.error("Minsplay startup error:", error);
  }
}

// Ensure startup runs immediately whether DOM is already loaded or still loading
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Minsplay PWA: Service Worker registered with scope:", registration.scope);
      })
      .catch((error) => {
        console.error("Minsplay PWA: Service Worker registration failed:", error);
      });
  });
}


