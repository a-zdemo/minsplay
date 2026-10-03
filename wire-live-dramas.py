with open("public/js/admin.js", "r", encoding="utf-8") as f:
    code = f.read()

vault_fn = """export async function fetchLiveDramaCount() {
  const dramaMetricEl = document.getElementById("metric-total-dramas");
  const catalogCountEl = document.getElementById("admin-catalog-count");
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/r2_media_vault?select=series_id`, {
      headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` }
    });
    if (res.ok) {
      const rows = await res.json();
      const uniqueSeries = new Set(rows.map(r => r.series_id).filter(Boolean));
      const count = uniqueSeries.size || DRAMA_CATALOG.length;
      if (dramaMetricEl) dramaMetricEl.textContent = count.toString();
      if (catalogCountEl) catalogCountEl.textContent = `Dramas (${count})`;
    }
  } catch (err) {
    console.warn("Error fetching Supabase vault drama count:", err);
  }
}
"""

if "export async function fetchLiveDramaCount()" not in code:
    code = vault_fn + "\n" + code

if "fetchLiveDramaCount();" not in code:
    code = code.replace(
        "renderDramaQueue();",
        "renderDramaQueue();\n  fetchLiveDramaCount();"
    )
    code = code.replace(
        "fetchSupabaseUsers();\n      showAppToast(",
        "fetchSupabaseUsers();\n      fetchLiveDramaCount();\n      showAppToast("
    )

with open("public/js/admin.js", "w", encoding="utf-8") as f:
    f.write(code)
print("  ✓ public/js/admin.js updated: Dramas count wired live to Supabase r2_media_vault")
