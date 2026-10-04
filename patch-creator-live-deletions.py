with open("public/js/creator.js", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update imports
old_imp = 'import { savePublishedEpisode, DRAMA_CATALOG, saveCatalogToStorage, syncCatalogFromVault } from "./series-data.js";'
new_imp = 'import { savePublishedEpisode, DRAMA_CATALOG, saveDramaToDatabase, deleteEpisodeFromCatalog, deleteSeriesFromCatalog, syncCatalogFromVault } from "./series-data.js";'

if old_imp in code:
    code = code.replace(old_imp, new_imp)

# 2. Update attachCMSEditModalEvents to save changes live to Supabase
old_modal_save = """      if (ep) {
        if (title) ep.title = title;
        ep.isFree = price === 0;
        if (src) ep.src = src;

        saveCatalogToStorage();
        renderCreatorCMSFeed();
        if (modal) modal.style.display = "none";
        showAppToast("Episode metadata updated successfully! ✓");
      }"""

new_modal_save = """      if (ep) {
        if (title) ep.title = title;
        ep.isFree = price === 0;
        if (src) ep.src = src;

        saveDramaToDatabase(drama).then(() => {
          renderCreatorCMSFeed();
          if (modal) modal.style.display = "none";
          showAppToast("Episode metadata saved to Supabase! ✓");
        });
      }"""

if old_modal_save in code:
    code = code.replace(old_modal_save, new_modal_save)

# 3. Update deleteEpisode and deleteSeries to delete from Supabase and r2_media_vault
old_delete_funcs = """function deleteEpisode(seriesId, epId) {
  const drama = DRAMA_CATALOG.find((d) => d.id === seriesId);
  if (!drama) return;

  const idx = drama.episodes.findIndex((e) => e.id === epId);
  if (idx >= 0) {
    drama.episodes.splice(idx, 1);
    saveCatalogToStorage();
    renderCreatorCMSFeed();
    showAppToast(`Deleted Episode ${epId} 🗑️`);
  }
}

function deleteSeries(seriesId) {
  const idx = DRAMA_CATALOG.findIndex((d) => d.id === seriesId);
  if (idx >= 0) {
    const deletedName = DRAMA_CATALOG[idx].title;
    DRAMA_CATALOG.splice(idx, 1);
    saveCatalogToStorage();
    renderCreatorCMSFeed();
    showAppToast(`Deleted "${deletedName}" from catalog 🗑️`);
  }
}"""

new_delete_funcs = """async function deleteEpisode(seriesId, epId) {
  const drama = DRAMA_CATALOG.find((d) => d.id === seriesId);
  if (!drama) return;

  const idx = drama.episodes.findIndex((e) => e.id === epId);
  if (idx >= 0) {
    const deletedEp = drama.episodes[idx];
    drama.episodes.splice(idx, 1);
    await deleteEpisodeFromCatalog(seriesId, epId, deletedEp?.src);
    renderCreatorCMSFeed();
    showAppToast(`Permanently deleted Episode ${epId} from catalog & vault 🗑️`);
  }
}

async function deleteSeries(seriesId) {
  const idx = DRAMA_CATALOG.findIndex((d) => d.id === seriesId);
  if (idx >= 0) {
    const deletedName = DRAMA_CATALOG[idx].title;
    DRAMA_CATALOG.splice(idx, 1);
    await deleteSeriesFromCatalog(seriesId);
    renderCreatorCMSFeed();
    showAppToast(`Permanently deleted "${deletedName}" from catalog & vault 🗑️`);
  }
}"""

if old_delete_funcs in code:
    code = code.replace(old_delete_funcs, new_delete_funcs)

with open("public/js/creator.js", "w", encoding="utf-8") as f:
    f.write(code)
print("  ✓ public/js/creator.js updated: Deletions and edits now execute live in Supabase & R2 Vault")
