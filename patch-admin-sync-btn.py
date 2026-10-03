# 1. Update public/pages/admin.html with Sync Vault button
with open("public/pages/admin.html", "r", encoding="utf-8") as f:
    h = f.read()

old_bar = '<div class="pane-action-bar"><span class="pane-subtitle" id="admin-catalog-count">Dramas (2)</span></div>'
new_bar = '<div class="pane-action-bar"><span class="pane-subtitle" id="admin-catalog-count">Dramas (2)</span><button id="btn-sync-vault-now" class="btn-vault-sync-pill" type="button">⚡ Sync Vault</button></div>'

if old_bar in h:
    h = h.replace(old_bar, new_bar)
elif "btn-sync-vault-now" not in h:
    h = h.replace('id="admin-catalog-count">', 'id="admin-catalog-count"></span><button id="btn-sync-vault-now" class="btn-vault-sync-pill" type="button">⚡ Sync Vault</button><span style="display:none;"')

with open("public/pages/admin.html", "w", encoding="utf-8") as f:
    f.write(h)

# 2. Update public/js/admin.js to wire the button
with open("public/js/admin.js", "r", encoding="utf-8") as f:
    js = f.read()

if 'import { syncVaultToDramasTable }' not in js:
    js = 'import { syncVaultToDramasTable } from "./series-data.js";\n' + js

wire_btn = """
  const syncVaultBtn = document.getElementById("btn-sync-vault-now");
  if (syncVaultBtn && !syncVaultBtn.dataset.wired) {
    syncVaultBtn.dataset.wired = "true";
    syncVaultBtn.onclick = async () => {
      syncVaultBtn.disabled = true;
      syncVaultBtn.textContent = "Syncing... ⏳";
      showAppToast("Syncing R2 Vault to dramas catalog... ⚡");
      const count = await syncVaultToDramasTable();
      await fetchLiveDramaCount();
      renderDramaQueue();
      syncVaultBtn.disabled = false;
      syncVaultBtn.textContent = "⚡ Sync Vault";
      showAppToast(`Synced ${count} series to catalog! ✓`);
    };
  }
"""

if "btn-sync-vault-now" not in js:
    js = js.replace("setupTabSwitching();", "setupTabSwitching();\n" + wire_btn)

with open("public/js/admin.js", "w", encoding="utf-8") as f:
    f.write(js)

# 3. Add styling in public/css/pages.css
with open("public/css/pages.css", "a", encoding="utf-8") as f:
    f.write("\n.btn-vault-sync-pill { all: unset !important; margin-left: auto !important; font-size: 0.72rem !important; font-weight: 800 !important; color: #ffc107 !important; background: rgba(255, 193, 7, 0.15) !important; border: 1px solid rgba(255, 193, 7, 0.35) !important; padding: 4px 10px !important; border-radius: 8px !important; cursor: pointer !important; }\n.btn-vault-sync-pill:active { transform: scale(0.95) !important; }\n")

print("  ✓ Admin Console: 1-Tap '⚡ Sync Vault' button installed and wired")
