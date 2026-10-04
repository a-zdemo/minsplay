# 1. Update settings.html
with open("public/pages/settings.html", "r", encoding="utf-8") as f:
    s_html = f.read()

admin_row = """      <!-- Staff Console Shortcut -->
      <article class="db-settings-row" id="row-admin-console" data-route="/admin" style="display: none;">
        <span class="db-settings-label" id="label-admin-console">🛡️ Staff Console</span>
        <div class="db-settings-right">
          <span class="db-settings-val">Manage ›</span>
        </div>
      </article>

      <!-- Become a Creator (Dynamic Status) -->"""

if "row-admin-console" not in s_html:
    s_html = s_html.replace("      <!-- Become a Creator (Dynamic Status) -->", admin_row)
    with open("public/pages/settings.html", "w", encoding="utf-8") as f:
        f.write(s_html)

# 2. Update settings.js
with open("public/js/settings.js", "r", encoding="utf-8") as f:
    s_js = f.read()

admin_toggle = """  const adminRow = document.getElementById("row-admin-console");
  const adminLabel = document.getElementById("label-admin-console");
  const isAdminOrSuper = user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN;
  if (adminRow) {
    adminRow.style.display = isAdminOrSuper ? "flex" : "none";
    if (adminLabel) adminLabel.textContent = user.role === ROLES.SUPER_ADMIN ? "👑 Super Admin Console" : "🛡️ Admin Console";
  }"""

if "row-admin-console" not in s_js:
    s_js = s_js.replace("export function initSettingsPage() {", "export function initSettingsPage() {\n" + admin_toggle)
    with open("public/js/settings.js", "w", encoding="utf-8") as f:
        f.write(s_js)

print("  ✓ Step 4 Complete: Staff Console shortcut added to settings page")
