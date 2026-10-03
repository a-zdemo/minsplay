export async function fetchLiveDramaCount() {
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

import { DRAMA_CATALOG } from "./series-data.js";
import { showAppToast } from "./router.js";
import { getCurrentUser, ROLES, getCreatorApplications, reviewCreatorApplication } from "./auth.js";

const SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDY4MjEsImV4cCI6MjEwNjM4MjgyMX0.26Lu_-rQX17LKXOSJ98d2OPRYIkfW_7S-8WaMsxqqeg";

let userSearchQuery = "";
let userCurrentPage = 1;
let userPageSize = 20;
let userTotalRecords = 0;

export function initAdminDashboard() {
  const user = getCurrentUser();
  const isSuper = user.role === ROLES.SUPER_ADMIN;

  const badge = document.getElementById("admin-role-badge");
  if (badge) badge.textContent = isSuper ? "👑 SUPER ADMIN" : "🛡️ ADMIN";

  const rolesTab = document.getElementById("tab-admin-roles");
  if (rolesTab) rolesTab.style.display = isSuper ? "inline-flex" : "none";

  setupTabSwitching();
  renderDramaQueue();
  fetchLiveDramaCount();
  renderCreatorRequestsQueue();
  fetchSupabaseUsers();

  const refreshBtn = document.getElementById("btn-admin-refresh");
  if (refreshBtn) {
    refreshBtn.onclick = () => {
      renderCreatorRequestsQueue();
      fetchSupabaseUsers();
      fetchLiveDramaCount();
      showAppToast("Admin data refreshed 🔄");
    };
  }
}

function setupTabSwitching() {
  const tabsBar = document.getElementById("admin-nav-tabs");
  if (!tabsBar) return;

  tabsBar.onclick = (e) => {
    const btn = e.target.closest(".admin-tab-btn");
    if (!btn) return;

    tabsBar.querySelectorAll(".admin-tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const paneId = btn.getAttribute("data-pane");
    document.querySelectorAll(".admin-pane").forEach((p) => {
      p.style.display = "none";
      p.classList.remove("active");
    });

    const activePane = document.getElementById(`pane-${paneId}`);
    if (activePane) {
      activePane.style.display = "flex";
      activePane.classList.add("active");
      if (paneId === "creator-requests") renderCreatorRequestsQueue();
      if (paneId === "roles") fetchSupabaseUsers();
    }
  };
}

export async function fetchSupabaseUsers() {
  const feed = document.getElementById("admin-users-roles-feed");
  const countEl = document.getElementById("metric-total-users");
  const foundPill = document.getElementById("users-total-found");
  const user = getCurrentUser();

  wireSearchControls();

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_platform_users`, {
      method: "POST",
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        search_query: userSearchQuery,
        page_num: userCurrentPage,
        page_size: userPageSize,
        admin_email: user.email || "hi.azdemo@gmail.com"
      })
    });

    if (!res.ok) throw new Error("Failed to fetch users");
    const data = await res.json();
    userTotalRecords = data.total || 0;

    if (countEl) countEl.textContent = userTotalRecords.toString();
    if (foundPill) foundPill.textContent = `${userTotalRecords} Users`;

    renderUsersList(data.users || []);
    renderPaginationFooter(userTotalRecords);
  } catch (err) {
    console.warn("Error loading Supabase users:", err);
    if (feed) feed.innerHTML = `<div class="admin-empty-state"><p style="color:#ff2e63;">Failed to load users: ${err.message}</p></div>`;
  }
}

function wireSearchControls() {
  const searchInput = document.getElementById("input-search-platform-users");
  const sizeSelect = document.getElementById("select-users-page-size");

  if (searchInput && !searchInput.dataset.wired) {
    searchInput.dataset.wired = "true";
    let timer = null;
    searchInput.oninput = (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        userSearchQuery = e.target.value.trim();
        userCurrentPage = 1;
        fetchSupabaseUsers();
      }, 350);
    };
  }

  if (sizeSelect && !sizeSelect.dataset.wired) {
    sizeSelect.dataset.wired = "true";
    sizeSelect.onchange = (e) => {
      userPageSize = parseInt(e.target.value, 10);
      userCurrentPage = 1;
      fetchSupabaseUsers();
    };
  }
}

function renderUsersList(users) {
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
}

async function updateRoleInDatabase(userId, newRole) {
  const cur = getCurrentUser();
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/set_user_platform_role`, {
      method: "POST",
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        target_user_id: userId,
        new_role: newRole,
        admin_email: cur.email || "hi.azdemo@gmail.com"
      })
    });
    if (!res.ok) throw new Error("Role update failed");
    showAppToast(`Updated user role to ${newRole.toUpperCase()} ✓`);
    fetchSupabaseUsers();
  } catch (e) {
    showAppToast(`Error updating role: ${e.message}`);
  }
}

function renderPaginationFooter(total) {
  const bar = document.getElementById("users-pagination-bar");
  const indicator = document.getElementById("users-page-indicator");
  const prevBtn = document.getElementById("btn-users-prev");
  const nextBtn = document.getElementById("btn-users-next");
  if (!bar) return;

  const totalPages = Math.max(1, Math.ceil(total / userPageSize));
  if (indicator) indicator.textContent = `Page ${userCurrentPage} of ${totalPages}`;

  if (prevBtn) {
    prevBtn.disabled = userCurrentPage <= 1;
    prevBtn.onclick = () => {
      if (userCurrentPage > 1) {
        userCurrentPage--;
        fetchSupabaseUsers();
      }
    };
  }

  if (nextBtn) {
    nextBtn.disabled = userCurrentPage >= totalPages;
    nextBtn.onclick = () => {
      if (userCurrentPage < totalPages) {
        userCurrentPage++;
        fetchSupabaseUsers();
      }
    };
  }
}

function renderDramaQueue() {
  const feed = document.getElementById("admin-dramas-feed");
  if (!feed) return;
  feed.innerHTML = DRAMA_CATALOG.map(d => `
    <article class="admin-drama-row">
      <div class="admin-thumb placeholder">🎬</div>
      <div class="admin-drama-info">
        <strong class="admin-drama-name">${d.title}</strong>
        <span class="admin-drama-sub">${d.genre} • ${(d.episodes || []).length} Episodes</span>
      </div>
    </article>
  `).join("");
}

export async function renderCreatorRequestsQueue() {
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
}


