export function initWalletSubViews() {
  document.addEventListener("click", (e) => {
    if (e.target.closest("#btn-wallet-trans")) {
      switchWalletView("view-wallet-trans");
      return;
    }
    if (e.target.closest("#btn-wallet-rewards")) {
      switchWalletView("view-wallet-rewards");
      return;
    }
    if (e.target.closest("#btn-wallet-consumption")) {
      switchWalletView("view-wallet-consumption");
      return;
    }
    if (e.target.closest(".db-wallet-sub-back")) {
      switchWalletView("view-wallet-main");
      return;
    }

    const tab = e.target.closest(".db-underline-tab");
    if (tab) {
      const container = tab.closest(".db-underline-tabs-row");
      if (container) {
        container.querySelectorAll(".db-underline-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        const tabType = tab.getAttribute("data-tab");
        const spentFeed = document.getElementById("consumption-spent-feed");
        const expiredFeed = document.getElementById("consumption-expired-feed");
        if (spentFeed && expiredFeed) {
          spentFeed.style.display = tabType === "spent" ? "flex" : "none";
          expiredFeed.style.display = tabType === "expired" ? "flex" : "none";
        }
      }
    }
  });
}

function switchWalletView(viewId) {
  const allViews = document.querySelectorAll(".db-wallet-view-pane");
  allViews.forEach((v) => {
    v.style.display = "none";
    v.classList.remove("active");
  });
  const target = document.getElementById(viewId);
  if (target) {
    target.style.display = "flex";
    target.classList.add("active");
    window.scrollTo(0, 0);
  }
}
