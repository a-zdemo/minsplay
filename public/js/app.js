import { initRouter } from "./router.js";

// 1. Initialize the Single Page Application Router
document.addEventListener("DOMContentLoaded", () => {
  initRouter();
});

// 2. Register PWA Service Worker for App Installation
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


