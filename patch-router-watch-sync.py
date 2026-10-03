with open("public/js/router.js", "r", encoding="utf-8") as f:
    r = f.read()

old_listener = """    if (currentPath === "/series" && currentActiveSeriesId) {
      renderSeriesDetail(currentActiveSeriesId);
    }"""

new_listener = """    if (currentPath === "/series" && currentActiveSeriesId) {
      renderSeriesDetail(currentActiveSeriesId);
    } else if (currentPath === "/watch") {
      const sId = currentActiveSeriesId || (DRAMA_CATALOG.length > 0 ? DRAMA_CATALOG[0].id : "");
      initPlayer(sId, pendingEpisode);
    }"""

if old_listener in r:
    r = r.replace(old_listener, new_listener)
    with open("public/js/router.js", "w", encoding="utf-8") as f:
        f.write(r)
    print("  ✓ Step 3: router.js now re-syncs /watch upon catalogUpdated")
else:
    print("  ✓ Step 3: Already configured")
