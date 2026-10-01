import { showAppToast, navigateTo } from "./router.js";

const AUTH_USER_KEY = "minsplay_auth_session_v1";

// 5-Tier RBAC Role Hierarchy
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  CREATOR: "creator",
  USER: "user",
  GUEST: "guest",
};

const DEFAULT_GUEST = {
  id: "guest_" + Math.random().toString(36).substr(2, 6),
  username: "Guest Explorer",
  email: null,
  role: ROLES.GUEST,
  avatar: "/icons/icon-animated.svg",
  coins: 20,
  creatorStatus: "none", // 'none' | 'applied' | 'approved'
};

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_GUEST;
  } catch {
    return DEFAULT_GUEST;
  }
}

export function saveCurrentUser(user) {
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent("authChanged", { detail: user }));
  } catch (e) {
    console.error("Failed to save auth session", e);
  }
}

// Single Login Function with Role-Based Routing
export function loginWithCredentials(email, role = ROLES.USER) {
  const cleanEmail = email.trim().toLowerCase();
  let assignedRole = role;

  // Auto-detect system roles for standard demo credentials
  if (cleanEmail === "superadmin@minsplay.com") assignedRole = ROLES.SUPER_ADMIN;
  else if (cleanEmail === "admin@minsplay.com") assignedRole = ROLES.ADMIN;
  else if (cleanEmail === "creator@minsplay.com") assignedRole = ROLES.CREATOR;

  const user = {
    id: "usr_" + Math.random().toString(36).substr(2, 6),
    username: cleanEmail.split("@")[0].toUpperCase(),
    email: cleanEmail,
    role: assignedRole,
    avatar: assignedRole === ROLES.SUPER_ADMIN ? "👑" : (assignedRole === ROLES.CREATOR ? "🎬" : "👤"),
    coins: assignedRole === ROLES.SUPER_ADMIN ? 9999 : 100,
    creatorStatus: assignedRole === ROLES.CREATOR ? "approved" : "none",
  };

  saveCurrentUser(user);
  showAppToast(`Signed in as ${user.username} (${user.role.toUpperCase()})`);

  // Target routing based on role
  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) {
    navigateTo("/admin");
  } else if (user.role === ROLES.CREATOR) {
    navigateTo("/creator");
  } else {
    navigateTo("/profile");
  }

  return user;
}

export function logout() {
  saveCurrentUser(DEFAULT_GUEST);
  showAppToast("Logged out to Guest session");
  navigateTo("/");
}

// Route Guard Verification
export function canAccessRoute(routePath) {
  const user = getCurrentUser();

  if (routePath === "/admin") {
    return user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN;
  }

  if (routePath === "/creator") {
    return user.role === ROLES.CREATOR || user.role === ROLES.SUPER_ADMIN;
  }

  return true;
}

// User Actions
export function applyForCreatorAccount() {
  const user = getCurrentUser();
  if (user.role === ROLES.GUEST) {
    openAuthModal("creator");
    return { success: false, reason: "login_required" };
  }

  user.creatorStatus = "applied";
  user.role = ROLES.CREATOR; // Fast-track approved in demo
  saveCurrentUser(user);
  showAppToast("🎉 Creator Account Activated! Access granted.");
  navigateTo("/creator");
  return { success: true };
}

export function promoteUserToRole(targetUserId, newRole) {
  const currentUser = getCurrentUser();
  if (currentUser.role !== ROLES.SUPER_ADMIN) {
    showAppToast("Permission denied: Super Admin authorization required");
    return false;
  }

  showAppToast(`User promoted to ${newRole.toUpperCase()} ✓`);
  return true;
}

export function openAuthModal(intendedAction = "") {
  const modal = document.getElementById("auth-modal");
  if (modal) {
    modal.setAttribute("data-intended", intendedAction);
    modal.style.display = "flex";
  }
}

export function closeAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (modal) modal.style.display = "none";
}
