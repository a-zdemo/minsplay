import { showAppToast, navigateTo } from "./router.js";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

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

const INITIAL_SUPER_ADMINS = ["nob@123.com", "superadmin@minsplay.com", "hi.azdemo@gmail.com"];
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

export async function signInWithOAuth(provider) {
  const isNative = Capacitor.isNativePlatform();
  // Deep link callback for native app, standard origin for web
  const redirectTarget = isNative
    ? "minsplay://auth-callback"
    : (window.location.origin + "/");

  const redirectUri = encodeURIComponent(redirectTarget);
  const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=${provider}&redirect_to=${redirectUri}`;

  if (isNative) {
    try {
      await Browser.open({ url: authUrl, windowName: "_blank" });
    } catch (e) {
      window.location.href = authUrl;
    }
  } else {
    window.location.href = authUrl;
  }
}

export async function handleOAuthCallback(customRawUrl = null) {
  let hash = "";
  if (customRawUrl && customRawUrl.includes("#")) {
    hash = customRawUrl.split("#")[1];
  } else if (window.location.hash) {
    hash = window.location.hash.substring(1);
  }

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
    try {
      window.history.replaceState({}, "", "/");
    } catch {}

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
  const user = getCurrentUser();
  if (!user.email || user.role === ROLES.GUEST) {
    showAppToast("You are not logged in");
    navigateTo("/auth");
    return;
  }

  saveCurrentUser(DEFAULT_GUEST);
  showAppToast("Logged out successfully ✓");
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

export async function submitCreatorApplication(studioName, bio) {
  const user = getCurrentUser();
  if (!user.email || user.role === ROLES.GUEST) {
    showAppToast("Please log in to apply for Creator Studio 🔒");
    navigateTo("/auth");
    return false;
  }
  const payload = {
    id: "app_" + Date.now(),
    user_id: user.id || user.email,
    username: user.username || user.email.split("@")[0],
    email: user.email,
    studio_name: studioName.trim() || user.username + " Studios",
    bio: bio.trim() || "Vertical drama creator.",
    status: "pending"
  };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/creator_applications`, {
      method: "POST",
      headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Supabase insert failed");
    saveCurrentUser({ ...user, creatorStatus: "pending" });
    showAppToast("Creator application submitted successfully! 🎬");
    return true;
  } catch (err) {
    showAppToast("Submission failed: " + err.message);
    return false;
  }
}

export async function getCreatorApplications() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/creator_applications?order=applied_at.desc`, {
      headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` }
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map(r => ({
      id: r.id, userId: r.user_id, username: r.username, email: r.email,
      studioName: r.studio_name, bio: r.bio, status: r.status, appliedAt: r.applied_at
    }));
  } catch { return []; }
}

export async function reviewCreatorApplication(appId, approve = true) {
  try {
    const status = approve ? "approved" : "rejected";
    const res = await fetch(`${SUPABASE_URL}/rest/v1/creator_applications?id=eq.${appId}`, {
      method: "PATCH",
      headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewed_at: new Date().toISOString() })
    });
    if (!res.ok) throw new Error("Update failed");
    showAppToast(approve ? "Approved Creator Studio! 🎬" : "Application rejected");
    return true;
  } catch (err) {
    showAppToast("Review failed: " + err.message);
    return false;
  }
}
