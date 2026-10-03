with open("public/js/admin.js", "r", encoding="utf-8") as f:
    code = f.read()

new_render_creator = """export async function renderCreatorRequestsQueue() {
  const feed = document.getElementById("admin-creator-apps-feed");
  const countBadge = document.getElementById("count-creator-requests");
  const metricBadge = document.getElementById("count-creator-requests-metric");
  if (!feed) return;

  const allApps = await getCreatorApplications();
  const pending = allApps.filter(a => a.status === "pending");
  if (countBadge) countBadge.textContent = pending.length.toString();
  if (metricBadge) metricBadge.textContent = pending.length.toString();

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
        <button class="btn-app-action approve" data-id="${app.id}" type="button">✓ Approve Creator</button>
        <button class="btn-app-action reject" data-id="${app.id}" type="button">✕ Reject</button>
      </div>
    </article>
  `).join("");

  feed.querySelectorAll(".btn-app-action.approve").forEach(b => {
    b.onclick = async () => { await reviewCreatorApplication(b.dataset.id, true); await renderCreatorRequestsQueue(); };
  });
  feed.querySelectorAll(".btn-app-action.reject").forEach(b => {
    b.onclick = async () => { await reviewCreatorApplication(b.dataset.id, false); await renderCreatorRequestsQueue(); };
  });
}"""

start_pos = code.find("export function renderCreatorRequestsQueue()")
if start_pos == -1:
    start_pos = code.find("export async function renderCreatorRequestsQueue()")

if start_pos != -1:
    end_pos = code.find("export function renderUsersRolesQueue", start_pos)
    if end_pos == -1:
        end_pos = code.find("function renderUsersList", start_pos)
    code = code[:start_pos] + new_render_creator + "\n\n" + code[end_pos:]

with open("public/js/admin.js", "w", encoding="utf-8") as f:
    f.write(code)
print("  ✓ public/js/admin.js updated: renderCreatorRequestsQueue now queries Supabase live")
