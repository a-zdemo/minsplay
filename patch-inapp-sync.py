with open("public/js/series-data.js", "r", encoding="utf-8") as f:
    code = f.read()

sync_fn = """export async function syncVaultToDramasTable() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/r2_media_vault?select=*&order=created_at.asc`, {
      headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` }
    });
    if (!res.ok) return 0;
    const assets = await res.json();
    if (!assets || assets.length === 0) return 0;
    const map = {};
    assets.forEach(a => {
      const sId = a.series_id || "the-dark-bees";
      if (!map[sId]) map[sId] = [];
      map[sId].push(a);
    });
    for (const sId of Object.keys(map)) {
      const items = map[sId];
      items.sort((a, b) => (a.object_key || a.filename || "").localeCompare(b.object_key || b.filename || ""));
      const episodes = items.map((it, idx) => ({
        id: idx + 1,
        title: it.title || `Episode ${idx + 1}`,
        duration: "1m 30s",
        isFree: (idx + 1) <= 2,
        src: it.public_url || `https://pub-446cc5245dc94ce0afede5f9a591d746.r2.dev/${it.object_key}`,
        posterUrl: ""
      }));
      const title = sId === "the-dark-bees" ? "The Dark Bees" : (sId === "the-beginning" ? "The Beginning" : sId.replace(/-/g, " ").replace(/\\b\\w/g, c => c.toUpperCase()));
      const genre = sId === "the-dark-bees" ? "Urban Suspense" : "Urban Drama";
      const synopsis = sId === "the-dark-bees" ? "A high-stakes vertical suspense thriller uncovering dark underworld syndicates." : "An empire falls and a ruthless heir rises to claim the throne.";
      await saveDramaToDatabase({
        id: sId, title, genre, synopsis, badge: "HOT", badgeClass: "badge-hot", posterUrl: "", plays: "1.2K", status: "published", episodes
      });
    }
    return Object.keys(map).length;
  } catch (e) { return 0; }
}
"""

if "export async function syncVaultToDramasTable()" not in code:
    code = sync_fn + "\n" + code

old_empty_check = 'if (rows.length > 0) {'
new_empty_check = """if (rows.length === 0) {
        await syncVaultToDramasTable();
        return DRAMA_CATALOG;
      }
      if (rows.length > 0) {"""

if old_empty_check in code and "await syncVaultToDramasTable();" not in code:
    code = code.replace(old_empty_check, new_empty_check)

with open("public/js/series-data.js", "w", encoding="utf-8") as f:
    f.write(code)
print("  ✓ public/js/series-data.js: In-app sync configured")
