export function initWalletSubViews() {
  document.addEventListener("click", (e) => {
    // 1. Open Transaction History (Pic 1)
    if (e.target.closest("#btn-wallet-trans")) {
      switchWalletView("view-wallet-trans");
      return;
    }

    // 2. Open Reward Coins (Pic 2)
    if (e.target.closest("#btn-wallet-rewards")) {
      switchWalletView("view-wallet-rewards");
      return;
    }

    // 3. Open Consumption Records (Pic 3)
    if (e.target.closest("#btn-wallet-consumption")) {
      switchWalletView("view-wallet-consumption");
      return;
    }

    // 4. Back button returns to main Wallet view
    if (e.target.closest(".db-wallet-sub-back")) {
      switchWalletView("view-wallet-main");
      return;
    }

    // 5. Consumption Underline Tabs (Spent vs Expired)
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
