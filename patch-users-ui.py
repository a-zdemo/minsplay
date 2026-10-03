with open("public/pages/admin.html", "r", encoding="utf-8") as f:
    h = f.read()
h = h.replace("Live Supabase Registered Users", "Users")
h = h.replace('id="users-total-found">3 Total</span>', 'id="users-total-found">3 Users</span>')
with open("public/pages/admin.html", "w", encoding="utf-8") as f:
    f.write(h)

with open("public/js/admin.js", "r", encoding="utf-8") as f:
    js = f.read()

js = js.replace('${userTotalRecords} Registered', '${userTotalRecords} Users')

new_render = """function renderUsersList(users) {
  const feed = document.getElementById("admin-users-roles-feed");
  if (!feed) return;
  if (users.length === 0) {
    feed.innerHTML = `<div class="admin-empty-state" style="padding:28px;text-align:center;color:rgba(255,255,255,0.5);"><p>No matching users found.</p></div>`;
    return;
  }
  feed.innerHTML = users.map(u => {
    const isTargetAdmin = u.role === ROLES.ADMIN;
    const isTargetSuper = u.role === ROLES.SUPER_ADMIN || u.email === "hi.azdemo@gmail.com";
    const shortId = (u.id || "").substring(0, 6).toUpperCase();
    const joined = (u.created_at || "").substring(0, 10);
    const rKey = u.role || "user";
    return `
      <article class="admin-user-role-card">
        <div class="admin-user-meta">
          <div class="admin-user-name-line">
            <strong class="admin-user-name">${u.username || 'User'}</strong>
            <span class="admin-role-pill ${rKey}">${rKey.toUpperCase()}</span>
          </div>
          <span class="admin-user-email">${u.email}</span>
          <span class="admin-user-id-sub">#${shortId} • Joined ${joined}</span>
        </div>
        <div class="admin-user-action-wrap">
          ${isTargetSuper ? '<span class="super-locked-tag">Platform Owner</span>' : `
            <button class="btn-user-promote ${isTargetAdmin ? 'demote' : 'promote'}" data-uid="${u.id}" data-action="${isTargetAdmin ? 'user' : 'admin'}" type="button">
              ${isTargetAdmin ? 'Demote to User' : '👑 Promote to Admin'}
            </button>
          `}
        </div>
      </article>`;
  }).join("");

  feed.querySelectorAll(".btn-user-promote").forEach(btn => {
    btn.onclick = async () => {
      await updateRoleInDatabase(btn.getAttribute("data-uid"), btn.getAttribute("data-action"));
    };
  });
}"""

start = js.find("function renderUsersList(users) {")
end = js.find("async function updateRoleInDatabase", start)
if start != -1 and end != -1:
    js = js[:start] + new_render + "\n\n" + js[end:]

with open("public/js/admin.js", "w", encoding="utf-8") as f:
    f.write(js)
print("  ✓ Step 1 Complete: UI logic patched with short ID and clean layout")
