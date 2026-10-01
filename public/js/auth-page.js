import { registerUser, loginWithCredentials, ROLES } from "./auth.js";
import { showAppToast } from "./router.js";

export function initAuthPage() {
  const tabSignIn = document.getElementById("tab-btn-signin");
  const tabSignUp = document.getElementById("tab-btn-signup");
  const formSignIn = document.getElementById("form-signin");
  const formSignUp = document.getElementById("form-signup");
  const rolePicker = document.getElementById("signup-role-picker");
  let selectedSignupRole = ROLES.USER;

  // 1. Tab Switcher
  if (tabSignIn && tabSignUp) {
    tabSignIn.onclick = () => {
      tabSignIn.classList.add("active");
      tabSignUp.classList.remove("active");
      if (formSignIn) formSignIn.style.display = "flex";
      if (formSignUp) formSignUp.style.display = "none";
    };

    tabSignUp.onclick = () => {
      tabSignUp.classList.add("active");
      tabSignIn.classList.remove("active");
      if (formSignUp) formSignUp.style.display = "flex";
      if (formSignIn) formSignIn.style.display = "none";
    };
  }

  // 2. Role Selector Chip
  if (rolePicker) {
    rolePicker.onclick = (e) => {
      const chip = e.target.closest(".role-chip");
      if (!chip) return;
      rolePicker.querySelectorAll(".role-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      selectedSignupRole = chip.getAttribute("data-role") || ROLES.USER;
    };
  }

  // 3. Sign In Submission
  const submitSignInBtn = document.getElementById("btn-submit-signin");
  if (submitSignInBtn) {
    submitSignInBtn.onclick = () => {
      const email = document.getElementById("signin-email")?.value.trim();
      const password = document.getElementById("signin-password")?.value.trim();
      if (!email || !password) {
        showAppToast("Please enter your email and password");
        return;
      }
      loginWithCredentials(email);
    };
  }

  // 4. Sign Up Submission
  const submitSignUpBtn = document.getElementById("btn-submit-signup");
  if (submitSignUpBtn) {
    submitSignUpBtn.onclick = () => {
      const username = document.getElementById("signup-username")?.value.trim();
      const email = document.getElementById("signup-email")?.value.trim();
      const password = document.getElementById("signup-password")?.value.trim();

      if (!username || !email || !password) {
        showAppToast("Please fill in all registration fields");
        return;
      }
      if (password.length < 6) {
        showAppToast("Password must be at least 6 characters");
        return;
      }
      registerUser(username, email, password, selectedSignupRole);
    };
  }

  // 5. Quick Role Presets
  document.querySelectorAll(".btn-demo-preset").forEach((btn) => {
    btn.onclick = () => {
      const demoRole = btn.getAttribute("data-demo");
      const demoEmails = {
        creator: "creator@minsplay.com",
        super_admin: "superadmin@minsplay.com",
        admin: "admin@minsplay.com",
        user: "viewer@minsplay.com"
      };
      loginWithCredentials(demoEmails[demoRole] || "viewer@minsplay.com", demoRole);
    };
  });
}
