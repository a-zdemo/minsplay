code = '''import { signInWithOAuth, handleOAuthCallback, switchRole, ROLES } from "./auth.js";
import { showAppToast } from "./router.js";

export function initAuthPage() {
  // 1. Check if returning from Google / Facebook OAuth redirect
  handleOAuthCallback();

  // 2. Facebook Sign In
  const fbBtn = document.getElementById("btn-auth-facebook");
  if (fbBtn) {
    fbBtn.onclick = () => {
      showAppToast("Connecting to Facebook OAuth... ⚡");
      signInWithOAuth("facebook");
    };
  }

  // 3. Google Sign In
  const googleBtn = document.getElementById("btn-auth-google");
  if (googleBtn) {
    googleBtn.onclick = () => {
      showAppToast("Connecting to Google OAuth... ⚡");
      signInWithOAuth("google");
    };
  }

  // 4. Staff 5-Tier RBAC Role Switcher Toggle
  const toggleBtn = document.getElementById("btn-toggle-staff-roles");
  const panel = document.getElementById("staff-roles-panel");
  if (toggleBtn && panel) {
    toggleBtn.onclick = () => {
      const isVisible = panel.style.display === "block";
      panel.style.display = isVisible ? "none" : "block";
    };
  }

  // 5. 1-Tap 5-Tier Role Switching
  document.querySelectorAll(".btn-rbac-pill").forEach((btn) => {
    btn.onclick = () => {
      const role = btn.getAttribute("data-rbac");
      if (role) switchRole(role);
    };
  });
}
'''
with open("public/js/auth-page.js", "w", encoding="utf-8") as f:
    f.write(code)
print("Updated public/js/auth-page.js with social login & RBAC triggers ✓")
