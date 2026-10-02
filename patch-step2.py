import re

# 1. Update creator.js
with open("public/js/creator.js", "r", encoding="utf-8") as f:
    creator_js = f.read()

# Make sure syncCatalogFromVault is imported
if "syncCatalogFromVault" not in creator_js:
    creator_js = creator_js.replace(
        'import { savePublishedEpisode, DRAMA_CATALOG, saveCatalogToStorage } from "./series-data.js";',
        'import { savePublishedEpisode, DRAMA_CATALOG, saveCatalogToStorage, syncCatalogFromVault } from "./series-data.js";'
    )

# Hook up refreshBtn and auto sync on Creator Studio init
refresh_hook = '''  if (refreshBtn) {
    refreshBtn.onclick = async () => {
      refreshBtn.disabled = true;
      showAppToast("Syncing with Cloudflare R2... ⚡");
      try {
        await syncCatalogFromVault(true);
        renderCreatorCMSFeed();
        if (seriesSelect) {
          const opts = DRAMA_CATALOG.map((d) => `<option value="${d.id}">${d.title}</option>`).join("");
          seriesSelect.innerHTML = opts + `<option value="new-series">+ Create New Drama Series...</option>`;
        }
        showAppToast(`Synced ${DRAMA_CATALOG.reduce((acc, d) => acc + (d.episodes ? d.episodes.length : 0), 0)} episodes from Cloudflare! ✓`);
      } catch (err) {
        showAppToast(`Sync failed: ${err.message}`);
      } finally {
        refreshBtn.disabled = false;
      }
    };
  }

  // Silent sync to ensure latest episodes are displayed
  syncCatalogFromVault(false).then(() => {
    renderCreatorCMSFeed();
  });'''

if "refreshBtn.onclick = async" not in creator_js:
    creator_js = creator_js.replace('if (publishBtn) publishBtn.onclick = handleEpisodePublish;', 'if (publishBtn) publishBtn.onclick = handleEpisodePublish;\n' + refresh_hook)

with open("public/js/creator.js", "w", encoding="utf-8") as f:
    f.write(creator_js)
print("Updated public/js/creator.js with live Cloudflare sync ✓")

# 2. Update router.js to re-render series detail on catalogUpdated
with open("public/js/router.js", "r", encoding="utf-8") as f:
    router_js = f.read()

listener_code = '''
  window.addEventListener("catalogUpdated", () => {
    const currentPath = window.location.pathname || "/";
    if (currentPath === "/series" && currentActiveSeriesId) {
      renderSeriesDetail(currentActiveSeriesId);
    }
  });
'''

if "catalogUpdated" not in router_js:
    router_js = router_js.replace("export function initRouter() {", "export function initRouter() {" + listener_code)
    with open("public/js/router.js", "w", encoding="utf-8") as f:
        f.write(router_js)
    print("Updated public/js/router.js to listen for catalog updates ✓")
