code = '''import { signInWithOAuth, handleOAuthCallback } from "./auth.js";
import { showAppToast } from "./router.js";

export function initAuthPage() {
  handleOAuthCallback();

  const fbBtn = document.getElementById("btn-auth-facebook");
  if (fbBtn) {
    fbBtn.onclick = () => {
      showAppToast("Connecting to Facebook OAuth... ⚡");
      signInWithOAuth("facebook");
    };
  }

  const googleBtn = document.getElementById("btn-auth-google");
  if (googleBtn) {
    googleBtn.onclick = () => {
      showAppToast("Connecting to Google OAuth... ⚡");
      signInWithOAuth("google");
    };
  }
}
'''
with open("public/js/auth-page.js", "w", encoding="utf-8") as f:
    f.write(code)
print("Updated public/js/auth-page.js ✓")
