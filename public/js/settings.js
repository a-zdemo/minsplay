import { getCurrentUser, logout, ROLES } from "./auth.js";
import { showAppToast, navigateTo } from "./router.js";

export function initSettingsPage() {
  const user = getCurrentUser();

  const adminRow = document.getElementById("row-admin-console");
  const adminLabel = document.getElementById("label-admin-console");
  const isAdminOrSuper = user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN;

  if (adminRow) {
    adminRow.style.display = isAdminOrSuper ? "flex" : "none";
    if (adminLabel) {
      adminLabel.textContent = user.role === ROLES.SUPER_ADMIN ? "👑 Super Admin Console" : "🛡️ Admin Console";
    }
  }

  const creatorRow = document.getElementById("row-become-creator");
  const creatorLabel = document.getElementById("label-creator-tab");
  const creatorVal = document.getElementById("val-creator-status");

  const isCreatorOrAdmin = user.role === ROLES.CREATOR || user.role === ROLES.SUPER_ADMIN;
  const isPending = user.creatorStatus === "pending";

  if (creatorLabel && creatorVal) {
    if (isCreatorOrAdmin) {
      creatorLabel.textContent = "Creator Studio 🎬";
      creatorVal.textContent = "Manage ›";
    } else if (isPending) {
      creatorLabel.textContent = "Become a creator";
      creatorVal.textContent = "Under Review ⏳";
    } else {
      creatorLabel.textContent = "Become a creator";
      creatorVal.textContent = "Apply ›";
    }
  }

  if (creatorRow) {
    creatorRow.onclick = () => {
      if (!user.email || user.role === ROLES.GUEST) {
        showAppToast("Please log in to apply for Creator Studio 🔒");
        navigateTo("/auth");
        return;
      }
      if (isCreatorOrAdmin) {
        navigateTo("/creator");
      } else if (isPending) {
        showAppToast("Your Creator application is currently under review by Admin ⏳");
      } else {
        user.creatorStatus = "pending";
        localStorage.setItem("minsplay_auth_session_v1", JSON.stringify(user));
        if (creatorVal) creatorVal.textContent = "Under Review ⏳";
        showAppToast("Application submitted! Admin will review your channel. 🎬");
      }
    };
  }

  const cacheRow = document.getElementById("row-clear-cache");
  const cacheVal = document.getElementById("settings-cache-val");
  if (cacheRow) {
    cacheRow.onclick = () => {
      if (cacheVal) cacheVal.textContent = "0.00MB";
      showAppToast("Cache cleared successfully 🗑️");
    };
  }

  // Dynamic Login / Logout Button Handling
  const logoutWrap = document.querySelector(".db-logout-wrap");
  const logoutBtn = document.getElementById("btn-db-logout");
  const isLoggedIn = Boolean(user && user.email && user.role !== ROLES.GUEST);

  if (logoutBtn && logoutWrap) {
    if (isLoggedIn) {
      logoutBtn.textContent = "Log out";
      logoutBtn.style.background = "rgba(255, 46, 99, 0.15)";
      logoutBtn.style.color = "#ff2e63";
      logoutBtn.onclick = () => {
        logout();
      };
    } else {
      logoutBtn.textContent = "Sign in / Register";
      logoutBtn.style.background = "linear-gradient(90deg, #00d2fc, #0077ff)";
      logoutBtn.style.color = "#ffffff";
      logoutBtn.onclick = () => {
        navigateTo("/auth");
      };
    }
  }
}
