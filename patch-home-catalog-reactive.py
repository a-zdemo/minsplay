with open("public/js/router.js", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update the catalogUpdated event listener in initRouter to re-render the Home grid
old_listener = """  window.addEventListener("catalogUpdated", () => {
    const currentPath = window.location.pathname || "/";
    if (currentPath === "/series" && currentActiveSeriesId) {
      renderSeriesDetail(currentActiveSeriesId);
    } else if (currentPath === "/watch") {
      const sId = currentActiveSeriesId || (DRAMA_CATALOG.length > 0 ? DRAMA_CATALOG[0].id : "");
      initPlayer(sId, pendingEpisode);
    }
  });"""

new_listener = """  window.addEventListener("catalogUpdated", () => {
    const currentPath = window.location.pathname || "/";
    if (currentPath === "/") {
      const grid = document.getElementById("home-drama-grid");
      const countBadge = document.getElementById("grid-count-badge");
      if (grid) {
        if (DRAMA_CATALOG.length === 0) {
          grid.innerHTML = `<div class="admin-empty-state" style="grid-column: span 3; text-align: center; padding: 48px 16px; color: rgba(255,255,255,0.5);"><span>🎬</span><p style="margin: 8px 0 0; font-size: 0.9rem;">No dramas published yet.<br><small style="color: rgba(255,255,255,0.35);">Test creators can upload new dramas in Creator Studio.</small></p></div>`;
          if (countBadge) countBadge.textContent = "0 Titles";
        } else {
          grid.innerHTML = DRAMA_CATALOG.map((d) => createDramaCardMarkup(d)).join("");
          if (countBadge) countBadge.textContent = `${DRAMA_CATALOG.length} Titles`;
        }
      }
      updateContinueWatching();
    } else if (currentPath === "/series" && currentActiveSeriesId) {
      renderSeriesDetail(currentActiveSeriesId);
    } else if (currentPath === "/watch") {
      const sId = currentActiveSeriesId || (DRAMA_CATALOG.length > 0 ? DRAMA_CATALOG[0].id : "");
      initPlayer(sId, pendingEpisode);
    }
  });"""

if old_listener in code:
    code = code.replace(old_listener, new_listener)
    with open("public/js/router.js", "w", encoding="utf-8") as f:
        f.write(code)
    print("  ✓ router.js updated: Home grid is now reactive to catalogUpdated")
else:
    print("  ✓ Listener pattern not matched or already patched")
