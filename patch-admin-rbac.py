import os

with open("public/pages/admin.html", "r", encoding="utf-8") as f:
    h = f.read()

nav_old = '''    <nav class="admin-nav-tabs" id="admin-nav-tabs">
      <button class="admin-tab-btn active" type="button" data-pane="dramas">Content Vault</button>
      <button class="admin-tab-btn" type="button" data-pane="creators">Creator Ladder</button>
      <button class="admin-tab-btn" type="button" data-pane="comments">Comments</button>
      <button class="admin-tab-btn" type="button" data-pane="storage">R2 Storage</button>
    </nav>'''

nav_new = '''    <nav class="admin-nav-tabs" id="admin-nav-tabs">
      <button class="admin-tab-btn active" type="button" data-pane="dramas">Content Vault</button>
      <button class="admin-tab-btn" type="button" data-pane="creator-requests" id="tab-creator-requests">Creator Requests (<span id="count-creator-requests">0</span>)</button>
      <button class="admin-tab-btn" type="button" data-pane="roles" id="tab-admin-roles" style="display: none;">👑 Users & Roles</button>
      <button class="admin-tab-btn" type="button" data-pane="storage">R2 Storage</button>
    </nav>'''

panes_insert = '''    <!-- TAB: Creator Requests Queue -->
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
      <div class="admin-items-feed" id="admin-users-roles-feed"></div>
    </div>
'''

if "tab-admin-roles" not in h:
    h = h.replace(nav_old, nav_new) if nav_old in h else h.replace('data-pane="creators">Creator Ladder</button>', 'data-pane="creator-requests" id="tab-creator-requests">Creator Requests (<span id="count-creator-requests">0</span>)</button>\n      <button class="admin-tab-btn" type="button" data-pane="roles" id="tab-admin-roles" style="display: none;">👑 Users & Roles</button>')
    h = h.replace('<!-- Interactive Stream Linker Modal -->', panes_insert + '\n  <!-- Interactive Stream Linker Modal -->')
    with open("public/pages/admin.html", "w", encoding="utf-8") as f:
        f.write(h)

with open("public/js/admin.js", "r", encoding="utf-8") as f:
    js = f.read()

js = js.replace('import { getCurrentUser, ROLES } from "./auth.js";', 'import { getCurrentUser, ROLES, getCreatorApplications, reviewCreatorApplication, getAllRegisteredUsers, promoteUserToAdmin } from "./auth.js";')

old_init = "export function initAdminDashboard() {\n  syncMetrics();"
new_init = """export function initAdminDashboard() {
  const user = getCurrentUser();
  const isSuper = user.role === ROLES.SUPER_ADMIN;

  const badge = document.querySelector(".admin-security-pill");
  if (badge) badge.textContent = isSuper ? "👑 SUPER ADMIN" : "🛡️ ADMIN";

  const rolesTab = document.getElementById("tab-admin-roles");
  if (rolesTab) rolesTab.style.display = isSuper ? "inline-flex" : "none";

  syncMetrics();
  renderCreatorRequestsQueue();
  if (isSuper) renderUsersRolesQueue();"""

js = js.replace(old_init, new_init)
js = js.replace('if (paneId === "tasks") renderRewardTasksQueue();', 'if (paneId === "tasks") renderRewardTasksQueue();\n        if (paneId === "creator-requests") renderCreatorRequestsQueue();\n        if (paneId === "roles") renderUsersRolesQueue();')

fn_body = """export function renderCreatorRequestsQueue() {
  const feed = document.getElementById("admin-creator-apps-feed");
  const countBadge = document.getElementById("count-creator-requests");
  const apps = getCreatorApplications();
  const pending = apps.filter(a => a.status === "pending");

  if (countBadge) countBadge.textContent = pending.length.toString();
  if (!feed) return;

  if (pending.length === 0) {
    feed.innerHTML = `<div class="admin-empty-state" style="padding:28px;text-align:center;color:rgba(255,255,255,0.5);"><p>No pending creator requests ✓</p></div>`;
    return;
  }

  feed.innerHTML = pending.map(app => `
    <article class="admin-app-card" data-app-id="${app.id}">
      <div class="admin-app-top">
        <div>
          <strong class="admin-app-title">🎬 ${app.studioName || 'Creator Studio'}</strong>
          <span class="admin-app-user">${app.username || 'User'} (${app.email})</span>
          <p class="admin-app-bio">${app.bio || 'Vertical drama creator.'}</p>
        </div>
      </div>
      <div class="admin-app-actions">
        <button class="btn-app-action approve" data-action="approve" data-id="${app.id}" type="button">✓ Approve Creator</button>
        <button class="btn-app-action reject" data-action="reject" data-id="${app.id}" type="button">✕ Reject</button>
      </div>
    </article>
  `).join("");

  feed.querySelectorAll(".btn-app-action").forEach(btn => {
    btn.onclick = () => {
      reviewCreatorApplication(btn.getAttribute("data-id"), btn.getAttribute("data-action") === "approve");
      renderCreatorRequestsQueue();
      syncMetrics();
    };
  });
}

export function renderUsersRolesQueue() {
  const feed = document.getElementById("admin-users-roles-feed");
  if (!feed) return;

  const users = getAllRegisteredUsers();
  if (users.length === 0) {
    feed.innerHTML = `<div class="admin-empty-state" style="padding:24px;text-align:center;color:rgba(255,255,255,0.5);"><p>No registered users found.</p></div>`;
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
            <button class="btn-user-promote ${isTargetAdmin ? 'demote' : 'promote'}" data-uid="${u.id}" type="button">
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
}
"""

if "function renderCreatorQueue() {}" in js:
    js = js.replace("function renderCreatorQueue() {}", fn_body)
else:
    js += "\n" + fn_body

with open("public/js/admin.js", "w", encoding="utf-8") as f:
    f.write(js)

with open("public/css/pages.css", "r", encoding="utf-8") as f:
    css = f.read()

if ".admin-user-role-card" not in css:
    css += """
.admin-app-card { background: #14141e; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 8px; }
.admin-app-title { font-size: 0.95rem; color: #fff; }
.admin-app-user { font-size: 0.75rem; color: #00d2fc; }
.admin-app-bio { margin: 4px 0 0; font-size: 0.78rem; color: rgba(255,255,255,0.6); }
.admin-app-actions { display: flex; gap: 8px; margin-top: 6px; }
.btn-app-action { all: unset; flex: 1; text-align: center; font-size: 0.78rem; font-weight: 800; padding: 8px 0; border-radius: 8px; cursor: pointer; }
.btn-app-action.approve { background: rgba(39,201,63,0.18); border: 1px solid rgba(39,201,63,0.35); color: #27c93f; }
.btn-app-action.reject { background: rgba(255,46,99,0.18); border: 1px solid rgba(255,46,99,0.35); color: #ff2e63; }
.admin-user-role-card { background: #14141e; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
.admin-user-meta { display: flex; flex-direction: column; gap: 2px; }
.admin-user-name { font-size: 0.92rem; font-weight: 800; color: #fff; }
.admin-user-email { font-size: 0.74rem; color: rgba(255,255,255,0.5); }
.btn-user-promote { all: unset; font-size: 0.74rem; font-weight: 800; padding: 6px 12px; border-radius: 10px; cursor: pointer; }
.btn-user-promote.promote { background: rgba(0,210,252,0.15); border: 1px solid rgba(0,210,252,0.4); color: #00d2fc; }
.btn-user-promote.demote { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.7); }
.super-locked-tag { font-size: 0.7rem; font-weight: 800; color: #ffc107; background: rgba(255,193,7,0.15); padding: 4px 8px; border-radius: 6px; }
"""
    with open("public/css/pages.css", "w", encoding="utf-8") as f:
        f.write(css)

print("Admin RBAC queues, promotion tab, and styles patched cleanly ✓")
