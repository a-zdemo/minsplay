import { initRouter } from "./router.js";
import { initPWA } from "./pwa.js";
import { initCommentsSystem } from "./comments.js";
import { initInboxSubViews } from "./inbox.js";
import { initWalletSubViews } from "./wallet.js";

function startApp() {
  try {
    initRouter();
    initPWA();
    initCommentsSystem();
    initInboxSubViews();
    initWalletSubViews();
  } catch (error) {
    console.error("Minsplay startup error:", error);
  }
}

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
        console.log("Minsplay PWA: Service Worker registered:", registration.scope);
      })
      .catch((error) => {
        console.error("Minsplay PWA: Service Worker registration failed:", error);
      });
  });
}
