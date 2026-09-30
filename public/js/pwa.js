let deferredInstallPrompt = null;

export function initPWA() {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  const banner = document.getElementById("pwa-install-banner");
  const installBtn = document.getElementById("pwa-install-btn");
  const dismissBtn = document.getElementById("pwa-dismiss-btn");

  if (isStandalone) {
    if (banner) banner.style.display = "none";
    return;
  }

  if (banner) {
    banner.style.display = "flex";
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (banner) banner.style.display = "flex";
  });

  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === "accepted") {
          if (banner) banner.style.display = "none";
        }
        deferredInstallPrompt = null;
      }
    });
  }

  if (dismissBtn) {
    dismissBtn.addEventListener("click", () => {
      if (banner) banner.style.display = "none";
    });
  }

  window.addEventListener("appinstalled", () => {
    if (banner) banner.style.display = "none";
    deferredInstallPrompt = null;
  });
}
