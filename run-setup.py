import os
import json
import re

print("==================================================================")
print("MINSPLAY 2.0: PRODUCTION RBAC LIFECYCLE & CREATOR APPROVAL ENGINE")
print("==================================================================")

# 1. UPDATE public/js/auth.js
print("\n[1/5] Updating public/js/auth.js...")
auth_js_code = '''import { showAppToast, navigateTo } from "./router.js";

const AUTH_USER_KEY = "minsplay_auth_session_v1";
const USERS_REGISTRY_KEY = "minsplay_users_registry_v1";
const CREATOR_APPS_KEY = "minsplay_creator_applications_v1";

const SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDY4MjEsImV4cCI6MjEwNjM4MjgyMX0.26Lu_-rQX17LKXOSJ98d2OPRYIkfW_7S-8WaMsxqqeg";

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  CREATOR: "creator",
  USER: "user",
  GUEST: "guest",
};

const DEFAULT_GUEST = {
  id: "guest_432655107",
  username: "Guest Explorer",
  email: null,
  role: ROLES.GUEST,
  avatar: "/icons/icon-animated.svg",
  coins: 20,
  creatorStatus: "none",
};

const INITIAL_SUPER_ADMINS = ["superadmin@minsplay.com", "hi.azdemo@gmail.com"];
const INITIAL_ADMINS = ["admin@minsplay.com"];

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
    syncUserToRegistry(user);
    window.dispatchEvent(new CustomEvent("authChanged", { detail: user }));
  } catch (e) {
    console.error("Failed to save auth session", e);
  }
}

export function getAllRegisteredUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_REGISTRY_KEY) || "[]");
  } catch {
    return [];
  }
}

function syncUserToRegistry(user) {
  if (!user.email || user.role === ROLES.GUEST) return;
  try {
    const users = getAllRegisteredUsers();
    const idx = users.findIndex(u => u.id === user.id || u.email === user.email);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn("Registry sync error", e);
  }
}

export function determineRole(email, userMetadata = {}) {
  const cleanEmail = (email || "").toLowerCase().trim();
  const registry = getAllRegisteredUsers();
  const existing = registry.find(u => u.email === cleanEmail);
  if (existing && existing.role) return existing.role;

  if (INITIAL_SUPER_ADMINS.includes(cleanEmail)) return ROLES.SUPER_ADMIN;
  if (INITIAL_ADMINS.includes(cleanEmail)) return ROLES.ADMIN;
  if (userMetadata.role) return userMetadata.role;

  return ROLES.USER;
}

export function signInWithOAuth(provider) {
  const redirectUri = encodeURIComponent(window.location.origin + "/");
  const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=${provider}&redirect_to=${redirectUri}`;
  window.location.href = authUrl;
}

export async function handleOAuthCallback() {
  const hash = window.location.hash.substring(1);
  if (!hash) return false;
  const params = new URLSearchParams(hash);
  const token = params.get("access_token");
  if (!token) return false;

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { "Authorization": `Bearer ${token}`, "apikey": ANON_KEY }
    });
    if (!res.ok) throw new Error("Failed to verify OAuth user");
    const data = await res.json();
    const email = data.email || "";
    const name = data.user_metadata?.full_name || data.user_metadata?.name || email.split("@")[0] || "User";
    const role = determineRole(email, data.user_metadata);

    const registry = getAllRegisteredUsers();
    const existing = registry.find(u => u.email === email);

    const userObj = {
      id: data.id || "usr_" + Math.random().toString(36).substr(2, 6),
      username: name,
      email: email,
      role: role,
      avatar: data.user_metadata?.avatar_url || "/icons/icon-192.png",
      coins: role === ROLES.SUPER_ADMIN ? 9999 : (existing?.coins || 50),
      creatorStatus: existing?.creatorStatus || (role === ROLES.CREATOR ? "approved" : "none"),
      createdAt: existing?.createdAt || Date.now()
    };

    saveCurrentUser(userObj);
    window.history.replaceState({}, "", "/");
    showAppToast(`Welcome back, ${userObj.username}! ✓`);
    redirectBasedOnRole(role);
    return true;
  } catch (err) {
    console.warn("OAuth verification error:", err);
    return false;
  }
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

export function submitCreatorApplication(studioName, bio) {
  const user = getCurrentUser();
  if (!user.email || user.role === ROLES.GUEST) {
    showAppToast("Please log in to apply for Creator Studio 🔒");
    navigateTo("/auth");
    return false;
  }

  const apps = getCreatorApplications();
  const existing = apps.find(a => a.userId === user.id && a.status === "pending");
  if (existing) {
    showAppToast("Your application is already pending review ⏳");
    return false;
  }

  const newApp = {
    id: "app_" + Date.now(),
    userId: user.id,
    username: user.username,
    email: user.email,
    studioName: studioName.trim() || user.username + " Studios",
    bio: bio.trim() || "Vertical drama creator.",
    status: "pending",
    appliedAt: Date.now()
  };

  apps.unshift(newApp);
  localStorage.setItem(CREATOR_APPS_KEY, JSON.stringify(apps));

  const updatedUser = { ...user, creatorStatus: "pending" };
  saveCurrentUser(updatedUser);
  showAppToast("Creator application submitted successfully! 🎬");
  return true;
}

export function getCreatorApplications() {
  try {
    return JSON.parse(localStorage.getItem(CREATOR_APPS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function reviewCreatorApplication(appId, approve = true) {
  const apps = getCreatorApplications();
  const target = apps.find(a => a.id === appId);
  if (!target) return false;

  target.status = approve ? "approved" : "rejected";
  target.reviewedAt = Date.now();
  localStorage.setItem(CREATOR_APPS_KEY, JSON.stringify(apps));

  const registry = getAllRegisteredUsers();
  const user = registry.find(u => u.id === target.userId || u.email === target.email);
  if (user) {
    user.creatorStatus = approve ? "approved" : "rejected";
    if (approve) user.role = ROLES.CREATOR;
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registry));

    const current = getCurrentUser();
    if (current.id === user.id) {
      saveCurrentUser({ ...current, role: user.role, creatorStatus: user.creatorStatus });
    }
  }

  showAppToast(approve ? `Approved ${target.studioName} as Creator! 🎬` : `Rejected application`);
  return true;
}

export function promoteUserToAdmin(userId, makeAdmin = true) {
  const current = getCurrentUser();
  if (current.role !== ROLES.SUPER_ADMIN) {
    showAppToast("Only Super Admin can manage staff roles 👑");
    return false;
  }

  const registry = getAllRegisteredUsers();
  const target = registry.find(u => u.id === userId);
  if (!target) return false;

  target.role = makeAdmin ? ROLES.ADMIN : ROLES.USER;
  localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registry));

  if (current.id === target.id) {
    saveCurrentUser({ ...current, role: target.role });
  }

  showAppToast(makeAdmin ? `Promoted ${target.username} to Admin 🛡️` : `Reverted ${target.username} to User`);
  return true;
}
'''
with open("public/js/auth.js", "w", encoding="utf-8") as f:
    f.write(auth_js_code)
print("  ✓ public/js/auth.js written.")

print("\nRunning build and verification...")
