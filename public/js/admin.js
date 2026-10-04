import { fetchAdmobConfig, getAdmobConfig, saveAdmobConfig, showRewardedVideo } from "./admob-manager.js";
import { syncVaultToDramasTable } from "./series-data.js";
export async function fetchLiveDramaCount() {
  const dramaMetricEl = document.getElementById("metric-total-dramas");
  const catalogCountEl = document.getElementById("admin-catalog-count");
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/dramas?select=id`, {
      headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` }
    });
    if (res.ok) {
      const rows = await res.json();
      const count = rows.length;
      
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
  const adsTab = document.getElementById("tab-admin-ads");
  if (adsTab) adsTab.style.display = isSuper ? "inline-flex" : "none";
  if (isSuper) initAdmobSettingsPanel();

  setupTabSwitching();

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
      if (paneId === "ads") loadAdmobFormValues();
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




function initAdmobSettingsPanel() {
  loadAdmobFormValues();

  const saveBtn = document.getElementById("btn-admob-save-config");
  if (saveBtn && !saveBtn.dataset.wired) {
    saveBtn.dataset.wired = "true";
    saveBtn.onclick = async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving to Cloud... ⏳";
      const payload = {
        enabled: document.getElementById("admob-toggle-enabled")?.checked ?? true,
        test_mode: document.getElementById("admob-toggle-testmode")?.checked ?? true,
        app_id: document.getElementById("admob-input-appid")?.value.trim() || "",
        rewarded_unlock_unit: document.getElementById("admob-input-rewarded-unlock")?.value.trim() || "",
        rewarded_unlock_coins: parseInt(document.getElementById("admob-input-unlock-coins")?.value || "30", 10),
        rewarded_task_coins: parseInt(document.getElementById("admob-input-task-coins")?.value || "20", 10),
        rewarded_task_unit: document.getElementById("admob-input-rewarded-task")?.value.trim() || "",
        rewarded_task_limit: parseInt(document.getElementById("admob-input-task-limit")?.value || "15", 10),
        interstitial_unit: document.getElementById("admob-input-interstitial")?.value.trim() || "",
        interstitial_frequency: parseInt(document.getElementById("admob-input-interstitial-freq")?.value || "3", 10),
        banner_unit: document.getElementById("admob-input-banner")?.value.trim() || ""
      };
      const ok = await saveAdmobConfig(payload);
      saveBtn.disabled = false;
      saveBtn.textContent = "Save AdMob Settings 💾";
      showAppToast(ok ? "AdMob configuration saved live to Supabase! ✓" : "Saved locally.");
    };
  }

  const resetBtn = document.getElementById("btn-admob-reset-defaults");
  if (resetBtn && !resetBtn.dataset.wired) {
    resetBtn.dataset.wired = "true";
    resetBtn.onclick = async () => {
      if (confirm("Reset all ad units to official Google test units?")) {
        await saveAdmobConfig({
          test_mode: true,
          enabled: true,
          app_id: "ca-app-pub-3940256099942544~3347511713",
          rewarded_unlock_unit: "ca-app-pub-3940256099942544/5224354917",
          rewarded_task_unit: "ca-app-pub-3940256099942544/5224354917",
          interstitial_unit: "ca-app-pub-3940256099942544/1033173712",
          banner_unit: "ca-app-pub-3940256099942544/6300978111"
        });
        loadAdmobFormValues();
        showAppToast("Restored Google AdMob test defaults ✓");
      }
    };
  }

  const testTriggerBtn = document.getElementById("btn-admob-test-trigger");
  if (testTriggerBtn && !testTriggerBtn.dataset.wired) {
    testTriggerBtn.dataset.wired = "true";
    testTriggerBtn.onclick = () => {
      showRewardedVideo({
        placement: "admin_test",
        onReward: () => showAppToast("🎉 AdMob reward granted successfully!"),
        onDismiss: () => showAppToast("Ad closed.")
      });
    };
  }
}

async function loadAdmobFormValues() {
  const cfg = await fetchAdmobConfig();
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ""; };
  const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = Boolean(val); };

  setChk("admob-toggle-enabled", cfg.enabled);
  setChk("admob-toggle-testmode", cfg.test_mode);
  setVal("admob-input-appid", cfg.app_id);
  setVal("admob-input-rewarded-unlock", cfg.rewarded_unlock_unit);
  setVal("admob-input-unlock-coins", cfg.rewarded_unlock_coins);
  setVal("admob-input-task-coins", cfg.rewarded_task_coins);
  setVal("admob-input-rewarded-task", cfg.rewarded_task_unit);
  setVal("admob-input-task-limit", cfg.rewarded_task_limit);
  setVal("admob-input-interstitial", cfg.interstitial_unit);
  setVal("admob-input-interstitial-freq", cfg.interstitial_frequency);
  setVal("admob-input-banner", cfg.banner_unit);
}
