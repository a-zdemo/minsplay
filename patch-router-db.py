with open("public/js/router.js", "r", encoding="utf-8") as f:
    code = f.read()

if 'import { initSettingsPage } from "./settings.js";' not in code:
    code = 'import { initSettingsPage } from "./settings.js";\n' + code

# Route controller hook
if 'else if (path === "/settings") {\n    initSettingsPage();\n  }' not in code:
    code = code.replace(
        'else if (path === "/profile") {\n    renderProfilePage();\n  }',
        'else if (path === "/profile") {\n    renderProfilePage();\n  } else if (path === "/settings") {\n    initSettingsPage();\n  }'
    )

new_profile_func = '''function renderProfilePage() {
  const user = getCurrentUser();
  const nameEl = document.getElementById("profile-display-name");
  const idEl = document.getElementById("profile-member-id");
  const coinEl = document.getElementById("profile-coin-balance");
  const avatarWrap = document.getElementById("profile-avatar-badge");
  const copyBtn = document.getElementById("btn-copy-id");

  let guestId = localStorage.getItem("minsplay_guest_id") || "74789317";
  const rawId = user.email ? (user.id || guestId) : guestId;

  // Generate clean 8-digit numeric ID like DramaBox (Screenshot 1)
  let numericId = "74789317";
  if (/^\\d{7,9}$/.test(rawId)) {
    numericId = rawId;
  } else {
    let hash = 0;
    for (let i = 0; i < rawId.length; i++) hash = ((hash << 5) - hash) + rawId.charCodeAt(i) | 0;
    numericId = ((Math.abs(hash) % 90000000) + 10000000).toString();
  }

  if (idEl) idEl.textContent = numericId;
  const username = user.email ? (user.username || user.email.split("@")[0]) : "Log in";
  if (nameEl) nameEl.textContent = username;
  if (coinEl) coinEl.textContent = (user.coins || 10).toString();

  if (avatarWrap) {
    if (user.avatar && (user.avatar.startsWith("http") || user.avatar.startsWith("/"))) {
      avatarWrap.innerHTML = `<img src="${user.avatar}" alt="${username}" class="db-avatar-img" />`;
    } else {
      const initial = username.charAt(0).toLowerCase();
      avatarWrap.innerHTML = `<div class="db-avatar-initial">${initial}</div>`;
    }
  }

  if (copyBtn) {
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard?.writeText(numericId);
      showAppToast(`ID ${numericId} copied to clipboard 📋`);
    };
  }
}'''

import re
code = re.sub(r'function renderProfilePage\(\)\s*\{[\s\S]*?\n\}', new_profile_func, code, count=1)

with open("public/js/router.js", "w", encoding="utf-8") as f:
    f.write(code)
print("Updated public/js/router.js ✓")
