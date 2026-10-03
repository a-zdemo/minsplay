import { DRAMA_CATALOG, saveCatalogToStorage } from "./series-data.js";
import { showAppToast, navigateTo } from "./router.js";
import { getCurrentUser, ROLES, getCreatorApplications, reviewCreatorApplication, getAllRegisteredUsers, promoteUserToAdmin } from "./auth.js";
import { getStoredTasks, saveStoredTasks, syncTasksFromSupabase } from "./rewards.js";
import { upsertTaskInDatabase, deleteTaskFromDatabase } from "./tasks-api.js";

const R2_BASE = "https://pub-446cc5245dc94ce0afede5f9a591d746.r2.dev";
let currentEditingTaskId = null;

export function initAdminDashboard() {
  const user = getCurrentUser();
  const isSuper = user.role === ROLES.SUPER_ADMIN;

  const badge = document.querySelector(".admin-security-pill");
  if (badge) badge.textContent = isSuper ? "👑 SUPER ADMIN" : "🛡️ ADMIN";

  const rolesTab = document.getElementById("tab-admin-roles");
  if (rolesTab) rolesTab.style.display = isSuper ? "inline-flex" : "none";

  syncMetrics();
  renderCreatorRequestsQueue();
  if (isSuper) renderUsersRolesQueue();
  renderDramaQueue();
  renderRewardTasksQueue();
  renderCreatorQueue();
  renderCommentQueue();
  attachAdminActions();
  attachTaskModalEvents();

  const refreshBtn = document.getElementById("btn-admin-refresh");
  if (refreshBtn) {
    refreshBtn.onclick = async () => {
      await syncTasksFromSupabase();
      syncMetrics();
      renderDramaQueue();
      renderRewardTasksQueue();
      showAppToast("Moderation feeds synced with database ✓");
    };
  }

  const tabsBar = document.getElementById("admin-nav-tabs");
  if (tabsBar) {
    tabsBar.onclick = (e) => {
      const btn = e.target.closest(".admin-tab-btn");
      if (!btn) return;
      tabsBar.querySelectorAll(".admin-tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const paneId = btn.getAttribute("data-pane");
      document.querySelectorAll(".admin-pane").forEach((pane) => {
        pane.style.display = "none";
        pane.classList.remove("active");
      });

      const activePane = document.getElementById(`pane-${paneId}`);
      if (activePane) {
        activePane.style.display = "flex";
        activePane.classList.add("active");
        if (paneId === "tasks") renderRewardTasksQueue();
        if (paneId === "creator-requests") renderCreatorRequestsQueue();
        if (paneId === "roles") renderUsersRolesQueue();
      }
    };
  }
}

function syncMetrics() {
  const dramasCountEl = document.getElementById("metric-total-dramas");
  const tasksCountEl = document.getElementById("metric-total-tasks");
  const issuesCountEl = document.getElementById("metric-pending-issues");
  const catalogCountEl = document.getElementById("admin-catalog-count");

  const tasks = getStoredTasks();

  if (dramasCountEl) dramasCountEl.textContent = DRAMA_CATALOG.length.toString();
  if (tasksCountEl) tasksCountEl.textContent = tasks.length.toString();
  if (catalogCountEl) catalogCountEl.textContent = `${DRAMA_CATALOG.length} Registered Dramas`;

  const flagged = DRAMA_CATALOG.filter((d) => d.status === "flagged" || d.status === "pending").length;
  if (issuesCountEl) issuesCountEl.textContent = flagged.toString();
}

export function renderRewardTasksQueue() {
  const feed = document.getElementById("admin-tasks-feed");
  const countSub = document.getElementById("admin-tasks-subtitle");
  if (!feed) return;

  const tasks = getStoredTasks();
  if (countSub) countSub.textContent = `${tasks.length} Active Reward Tasks in Supabase`;

  if (tasks.length === 0) {
    feed.innerHTML = `<div class="admin-empty-state"><span>🪙</span><p>No reward tasks configured.</p></div>`;
    return;
  }

  feed.innerHTML = tasks.map((task) => `
    <article class="admin-task-card" data-task-id="${task.id}">
      <div class="task-card-left">
        <span class="task-card-icon">${task.icon || '🎁'}</span>
        <div class="task-card-meta">
          <strong class="task-card-name">${task.title}</strong>
          <span class="task-card-reward">+${task.reward} Coins • Action: ${task.actionType}</span>
        </div>
      </div>
      <div class="task-card-actions">
        <button class="btn-mod-action edit-task" data-action="edit-task" data-id="${task.id}">Edit ✏️</button>
        <button class="btn-mod-action delete" data-action="delete-task" data-id="${task.id}">Delete ✕</button>
      </div>
    </article>
  `).join("");

  attachRewardTasksFeedActions();
}

function attachRewardTasksFeedActions() {
  const feed = document.getElementById("admin-tasks-feed");
  if (!feed) return;

  feed.onclick = async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const taskId = btn.getAttribute("data-id");
    const tasks = getStoredTasks();

    if (action === "edit-task") {
      openTaskEditModal(taskId);
    } else if (action === "delete-task") {
      const updated = tasks.filter((t) => t.id !== taskId);
      saveStoredTasks(updated);
      renderRewardTasksQueue();
      syncMetrics();

      // Persist deletion directly to Supabase
      await deleteTaskFromDatabase(taskId);
      showAppToast("Reward task deleted from database 🗑️");
    }
  };
}

function openTaskEditModal(taskId = null) {
  currentEditingTaskId = taskId;
  const modal = document.getElementById("admin-task-modal");
  const titleEl = document.getElementById("modal-task-title");
  const nameInput = document.getElementById("input-task-name");
  const rewardInput = document.getElementById("input-task-reward");
  const iconInput = document.getElementById("input-task-icon");
  const actionSelect = document.getElementById("select-task-action");
  const btnInput = document.getElementById("input-task-btn");

  if (!modal) return;

  if (taskId) {
    const tasks = getStoredTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      if (titleEl) titleEl.textContent = "Edit Reward Task ✏";
      if (nameInput) nameInput.value = task.title;
      if (rewardInput) rewardInput.value = task.reward || 30;
      if (iconInput) iconInput.value = task.icon || "🎁";
      if (actionSelect) actionSelect.value = task.actionType || "ad";
      if (btnInput) btnInput.value = task.btnLabel || "Go";
    }
  } else {
    if (titleEl) titleEl.textContent = "Create Reward Task 🪙";
    if (nameInput) nameInput.value = "";
    if (rewardInput) rewardInput.value = "30";
    if (iconInput) iconInput.value = "🎁";
    if (actionSelect) actionSelect.value = "ad";
    if (btnInput) btnInput.value = "Go";
  }

  modal.style.display = "flex";
}

function attachTaskModalEvents() {
  const modal = document.getElementById("admin-task-modal");
  const openCreateBtn = document.getElementById("btn-create-task-modal");
  const closeBtn = document.getElementById("btn-close-task-modal");
  const cancelBtn = document.getElementById("btn-cancel-task");
  const saveBtn = document.getElementById("btn-save-task");

  if (openCreateBtn) openCreateBtn.onclick = () => openTaskEditModal(null);
  if (closeBtn) closeBtn.onclick = () => { if (modal) modal.style.display = "none"; };
  if (cancelBtn) cancelBtn.onclick = () => { if (modal) modal.style.display = "none"; };

  if (saveBtn) {
    saveBtn.onclick = async () => {
      const name = document.getElementById("input-task-name")?.value.trim();
      const reward = parseInt(document.getElementById("input-task-reward")?.value || "30", 10);
      const icon = document.getElementById("input-task-icon")?.value.trim() || "🎁";
      const actionType = document.getElementById("select-task-action")?.value || "ad";
      const btnLabel = document.getElementById("input-task-btn")?.value.trim() || "Go";

      if (!name) {
        showAppToast("Please enter a task title");
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = "Saving to Supabase...";

      const tasks = getStoredTasks();
      let targetTask = null;

      if (currentEditingTaskId) {
        targetTask = tasks.find((t) => t.id === currentEditingTaskId);
        if (targetTask) {
          targetTask.title = name;
          targetTask.reward = reward;
          targetTask.desc = `+ ${reward} reward coins`;
          targetTask.icon = icon;
          targetTask.actionType = actionType;
          targetTask.btnLabel = btnLabel;
        }
      } else {
        targetTask = {
          id: `task_${Date.now()}`,
          title: name,
          desc: `+ ${reward} reward coins`,
          reward,
          icon,
          actionType,
          btnLabel,
          completed: false
        };
        tasks.push(targetTask);
      }

      saveStoredTasks(tasks);
      renderRewardTasksQueue();
      syncMetrics();

      // Persist to Supabase PostgreSQL table
      await upsertTaskInDatabase(targetTask);

      saveBtn.disabled = false;
      saveBtn.textContent = "Save Task ✓";
      if (modal) modal.style.display = "none";
      showAppToast("Task saved to Supabase successfully! ✓");
    };
  }
}

function renderDramaQueue() {
  const feed = document.getElementById("admin-dramas-feed");
  if (!feed) return;
  feed.innerHTML = DRAMA_CATALOG.map((drama) => `
    <article class="admin-drama-row" data-series-id="${drama.id}">
      <div class="admin-thumb placeholder">🎬</div>
      <div class="admin-drama-info">
        <strong class="admin-drama-name">${drama.title}</strong>
        <span class="admin-drama-sub">${drama.genre} • ${(drama.episodes || []).length} Episodes</span>
      </div>
    </article>
  `).join("");
}

export function renderCreatorRequestsQueue() {
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
}