code = '''import { showAppToast, navigateTo } from "./router.js";

const AUTH_USER_KEY = "minsplay_auth_session_v1";
const USERS_DB_KEY = "minsplay_registered_users_v1";
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
  id: "guest_" + (localStorage.getItem("minsplay_guest_id") || "432655107"),
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

export function switchRole(targetRole) {
  const roleProfiles = {
    [ROLES.SUPER_ADMIN]: { id: "usr_superadmin", username: "Super Admin", email: "superadmin@minsplay.com", role: ROLES.SUPER_ADMIN, coins: 9999, avatar: "👑", creatorStatus: "approved" },
    [ROLES.ADMIN]: { id: "usr_admin", username: "Content Admin", email: "admin@minsplay.com", role: ROLES.ADMIN, coins: 500, avatar: "🛡️", creatorStatus: "approved" },
    [ROLES.CREATOR]: { id: "usr_creator", username: "Verified Creator", email: "creator@minsplay.com", role: ROLES.CREATOR, coins: 350, avatar: "🎬", creatorStatus: "approved" },
    [ROLES.USER]: { id: "usr_" + Math.random().toString(36).substr(2, 6), username: "DramaFan", email: "user@minsplay.com", role: ROLES.USER, coins: 100, avatar: "👤", creatorStatus: "none" },
    [ROLES.GUEST]: DEFAULT_GUEST,
  };

  const selected = roleProfiles[targetRole] || DEFAULT_GUEST;
  saveCurrentUser(selected);
  showAppToast(`Switched to ${selected.username} (${targetRole.toUpperCase()}) ⚡`);
  redirectBasedOnRole(targetRole);
  return selected;
}

export function signInWithOAuth(provider) {
  const redirectUri = encodeURIComponent(window.location.origin + "/auth");
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
    if (!res.ok) throw new Error("Failed to fetch user");
    const data = await res.json();
    const email = data.email || "user@minsplay.com";
    const name = data.user_metadata?.full_name || data.user_metadata?.name || email.split("@")[0];

    let role = ROLES.USER;
    if (email.includes("superadmin")) role = ROLES.SUPER_ADMIN;
    else if (email.includes("admin")) role = ROLES.ADMIN;

    const userObj = {
      id: data.id || "usr_" + Math.random().toString(36).substr(2, 6),
      username: name,
      email: email,
      role: role,
      avatar: data.user_metadata?.avatar_url || "👤",
      coins: 100,
      creatorStatus: "none",
      createdAt: Date.now()
    };

    saveCurrentUser(userObj);
    window.history.replaceState({}, "", "/profile");
    showAppToast(`Signed in as ${userObj.username}! ✓`);
    redirectBasedOnRole(role);
    return true;
  } catch (err) {
    console.warn("OAuth parse error:", err);
    return false;
  }
}

export function redirectBasedOnRole(role) {
  if (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN) navigateTo("/admin");
  else if (role === ROLES.CREATOR) navigateTo("/creator");
  else navigateTo("/profile");
}

export function logout() {
  saveCurrentUser(DEFAULT_GUEST);
  showAppToast("Logged out successfully");
  navigateTo("/");
}

export function canAccessRoute(routePath) {
  const user = getCurrentUser();
  if (routePath === "/admin") return user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN;
  if (routePath === "/creator") return user.role === ROLES.CREATOR || user.role === ROLES.SUPER_ADMIN;
  return true;
}
'''
with open("public/js/auth.js", "w", encoding="utf-8") as f:
    f.write(code)
print("Updated public/js/auth.js with Supabase OAuth and 5-Tier RBAC ✓")
