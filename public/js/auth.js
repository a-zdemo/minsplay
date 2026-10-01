import { showAppToast, navigateTo } from "./router.js";

const AUTH_USER_KEY = "minsplay_auth_session_v1";
const USERS_DB_KEY = "minsplay_registered_users_v1";

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
  creatorStatus: "none",
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

export function registerUser(username, email, password, role = ROLES.USER) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = username.trim() || cleanEmail.split("@")[0];

  let users = [];
  try {
    users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || "[]");
  } catch (e) {}

  if (users.some((u) => u.email === cleanEmail)) {
    showAppToast("An account with this email already exists.");
    return null;
  }

  const newUser = {
    id: "usr_" + Math.random().toString(36).substr(2, 6),
    username: cleanName,
    email: cleanEmail,
    role,
    avatar: role === ROLES.CREATOR ? "🎬" : "👤",
    coins: 50,
    creatorStatus: role === ROLES.CREATOR ? "approved" : "none",
    createdAt: Date.now()
  };

  users.push(newUser);
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

  saveCurrentUser(newUser);
  showAppToast(`🎉 Welcome ${newUser.username}! Account created.`);
  redirectBasedOnRole(newUser.role);
  return newUser;
}

export function loginWithCredentials(email, role = ROLES.USER) {
  const cleanEmail = email.trim().toLowerCase();
  let assignedRole = role;

  if (cleanEmail === "superadmin@minsplay.com") assignedRole = ROLES.SUPER_ADMIN;
  else if (cleanEmail === "admin@minsplay.com") assignedRole = ROLES.ADMIN;
  else if (cleanEmail === "creator@minsplay.com") assignedRole = ROLES.CREATOR;

  let existingUser = null;
  try {
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || "[]");
    existingUser = users.find((u) => u.email === cleanEmail);
  } catch (e) {}

  const user = existingUser || {
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
  redirectBasedOnRole(user.role);
  return user;
}

export function redirectBasedOnRole(role) {
  if (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN) {
    navigateTo("/admin");
  } else if (role === ROLES.CREATOR) {
    navigateTo("/creator");
  } else {
    navigateTo("/profile");
  }
}

export function logout() {
  saveCurrentUser(DEFAULT_GUEST);
  showAppToast("Logged out successfully");
  navigateTo("/");
}

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

export function openAuthModal() {
  navigateTo("/auth");
}
