with open("public/js/router.js", "r", encoding="utf-8") as f:
    code = f.read()

# Add empty state handler to home drama grid
old_render_grid = """  function renderGrid(dramas) {
    grid.innerHTML = dramas.map((d) => createDramaCardMarkup(d)).join("");
    if (countBadge) countBadge.textContent = `${dramas.length} Titles`;
  }"""

new_render_grid = """  function renderGrid(dramas) {
    if (dramas.length === 0) {
      grid.innerHTML = `<div class="admin-empty-state" style="grid-column: span 3; text-align: center; padding: 48px 16px; color: rgba(255,255,255,0.5);"><span>🎬</span><p style="margin: 8px 0 0; font-size: 0.9rem;">No dramas published yet.<br><small style="color: rgba(255,255,255,0.35);">Test creators can upload new dramas in Creator Studio.</small></p></div>`;
      if (countBadge) countBadge.textContent = "0 Titles";
      return;
    }
    grid.innerHTML = dramas.map((d) => createDramaCardMarkup(d)).join("");
    if (countBadge) countBadge.textContent = `${dramas.length} Titles`;
  }"""

if old_render_grid in code:
    code = code.replace(old_render_grid, new_render_grid)
    with open("public/js/router.js", "w", encoding="utf-8") as f:
        f.write(code)
    print("  ✓ public/js/router.js: Clean empty state added for fresh testing catalog")
else:
    print("  ✓ public/js/router.js already up to date")
