with open("public/pages/admin.html", "r", encoding="utf-8") as f:
    h = f.read()

# 1. Fix DOM nesting: Move premature closing </div> of admin-body to after pane-roles
panes_block = '''    <!-- TAB: Creator Requests Queue -->
    <div class="admin-pane" id="pane-creator-requests" style="display: none;">
      <div class="pane-action-bar">
        <span class="pane-subtitle">Pending Creator Studio Applications</span>
      </div>
      <div class="admin-items-feed" id="admin-creator-apps-feed"></div>
    </div>

    <!-- TAB: Users & Roles (Super Admin Exclusive) -->
    <div class="admin-pane" id="pane-roles" style="display: none;">
      <div class="pane-action-bar">
        <span class="pane-subtitle">Platform Users & Staff Promotion</span>
      </div>
      <div class="admin-promote-bar">
        <input type="email" id="input-promote-user-email" class="admin-promote-input" placeholder="Enter user email to promote..." />
        <button class="btn-promote-submit" id="btn-promote-user-submit" type="button">👑 Promote</button>
      </div>
      <div class="admin-items-feed" id="admin-users-roles-feed"></div>
    </div>
  </div>'''

# Remove old misplaced panes and closing tag
h = h.replace('    <!-- TAB: Creator Requests Queue -->', '')
h = h.replace('    <div class="admin-pane" id="pane-creator-requests"', '')
h = h.split('    <!-- TAB: Cloudflare R2 Media Health -->')[0] + '''    <!-- TAB: Cloudflare R2 Media Health -->
    <div class="admin-pane" id="pane-storage" style="display: none;">
      <div class="admin-card r2-health-card">
        <h4 class="card-title">Cloudflare R2 Media Vault</h4>
        <p class="card-desc">Public Domain: <code>https://pub-446cc5245dc94ce0afede5f9a591d746.r2.dev</code></p>
        <div class="r2-status-pill">● Direct Video Gateway Online</div>
        <button class="btn-admin-outline" id="btn-test-r2-ping" type="button">Test R2 Gateway Ping</button>
      </div>
    </div>
''' + panes_block + '\n\n  <!-- Interactive Stream Linker Modal -->' + h.split('  <!-- Interactive Stream Linker Modal -->')[-1]

with open("public/pages/admin.html", "w", encoding="utf-8") as f:
    f.write(h)

# 2. Update public/js/admin.js with direct email promote handler & auto-seed
with open("public/js/admin.js", "r", encoding="utf-8") as f:
    js = f.read()

new_render_roles = """export function renderUsersRolesQueue() {
  const feed = document.getElementById("admin-users-roles-feed");
  if (!feed) return;

  const promoteBtn = document.getElementById("btn-promote-user-submit");
  const emailInput = document.getElementById("input-promote-user-email");
  if (promoteBtn && emailInput && !promoteBtn.dataset.wired) {
    promoteBtn.dataset.wired = "true";
    promoteBtn.onclick = () => {
      const email = emailInput.value.trim().toLowerCase();
      if (!email || !email.includes("@")) {
        showAppToast("Please enter a valid email address");
        return;
      }
      promoteUserToAdmin(email, true);
      emailInput.value = "";
      renderUsersRolesQueue();
    };
  }

  let users = getAllRegisteredUsers();
  const cur = getCurrentUser();
  if (cur && cur.email && !users.some(u => u.email === cur.email)) {
    users.unshift(cur);
  }

  if (users.length === 0) {
    feed.innerHTML = `<div class="admin-empty-state" style="padding:24px;text-align:center;color:rgba(255,255,255,0.5);"><p>No registered users found yet. Use the email box above to promote any user.</p></div>`;
    return;
  }

  feed.innerHTML = users.map(u => {
    const isTargetAdmin = u.role === ROLES.ADMIN;
    const isTargetSuper = u.role === ROLES.SUPER_ADMIN;
    return `
      <article class="admin-user-role-card">
        <div class="admin-user-meta">
          <strong class="admin-user-name">${u.username || 'User'}</strong>
          <span class="admin-user-email">${u.email}</span>
          <span class="settings-user-role-tag ${u.role || 'user'}">${(u.role || 'user').toUpperCase()}</span>
        </div>
        <div class="admin-user-action-wrap">
          ${isTargetSuper ? '<span class="super-locked-tag">Platform Owner</span>' : `
            <button class="btn-user-promote ${isTargetAdmin ? 'demote' : 'promote'}" data-uid="${u.id || u.email}" type="button">
              ${isTargetAdmin ? 'Demote to User' : '👑 Promote to Admin'}
            </button>
          `}
        </div>
      </article>
    `;
  }).join("");

  feed.querySelectorAll(".btn-user-promote").forEach(btn => {
    btn.onclick = () => {
      promoteUserToAdmin(btn.getAttribute("data-uid"), !btn.classList.contains("demote"));
      renderUsersRolesQueue();
    };
  });
}"""

old_fn_start = js.find("export function renderUsersRolesQueue()")
if old_fn_start != -1:
    js = js[:old_fn_start] + new_render_roles
else:
    js += "\n" + new_render_roles

with open("public/js/admin.js", "w", encoding="utf-8") as f:
    f.write(js)

# 3. Update public/js/auth.js so promoteUserToAdmin accepts email or ID
with open("public/js/auth.js", "r", encoding="utf-8") as f:
    auth_js = f.read()

auth_target_find = "const target = registry.find(u => u.id === userId);"
auth_target_replace = """let target = registry.find(u => u.id === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase()));
  if (!target && userId.includes("@")) {
    target = { id: "usr_" + Math.random().toString(36).substr(2, 6), username: userId.split("@")[0], email: userId, role: makeAdmin ? ROLES.ADMIN : ROLES.USER };
    registry.push(target);
  }"""

if auth_target_find in auth_js:
    auth_js = auth_js.replace(auth_target_find, auth_target_replace)
    with open("public/js/auth.js", "w", encoding="utf-8") as f:
        f.write(auth_js)

# 4. Append Promote Bar CSS styles
with open("public/css/pages.css", "r", encoding="utf-8") as f:
    css = f.read()

if ".admin-promote-bar" not in css:
    css += """
.admin-promote-bar { display: flex; gap: 8px; margin-bottom: 14px; }
.admin-promote-input { all: unset; flex: 1; background: #1a1a26; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 10px 14px; font-size: 0.82rem; color: #fff; }
.btn-promote-submit { all: unset; background: linear-gradient(135deg, #00d2fc, #0077ff); color: #fff; font-weight: 800; font-size: 0.82rem; padding: 0 16px; border-radius: 10px; cursor: pointer; white-space: nowrap; }
.admin-pane { width: 100%; flex-direction: column; }
"""
    with open("public/css/pages.css", "w", encoding="utf-8") as f:
        f.write(css)

print("Fixed admin container nesting, wired email promoter, and styled panes ✓")
