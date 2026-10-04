with open("public/js/router.js", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Ensure fetchCatalogFromDatabase is imported
if "fetchCatalogFromDatabase" not in code:
    code = code.replace(
        'import { DRAMA_CATALOG, getSeriesById } from "./series-data.js";',
        'import { DRAMA_CATALOG, getSeriesById, fetchCatalogFromDatabase } from "./series-data.js";'
    )

# 2. Update initHomeFilterSystem to auto-fetch if catalog is empty on boot
old_render = "  renderGrid(DRAMA_CATALOG);"
new_render = """  renderGrid(DRAMA_CATALOG);
  if (DRAMA_CATALOG.length === 0) {
    fetchCatalogFromDatabase().then((fresh) => {
      renderGrid(fresh && fresh.length > 0 ? fresh : DRAMA_CATALOG);
      updateContinueWatching();
    }).catch(() => {});
  }"""

if old_render in code and "fetchCatalogFromDatabase().then" not in code:
    code = code.replace(old_render, new_render, 1)

with open("public/js/router.js", "w", encoding="utf-8") as f:
    f.write(code)
print("  ✓ Step 1 Complete: Home page now auto-fetches and renders on boot without tab switching")
