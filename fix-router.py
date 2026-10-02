import os

router_path = "public/js/router.js"
with open(router_path, "r", encoding="utf-8") as f:
    code = f.read()

if 'import { initSettingsPage } from "./settings.js";' not in code:
    code = 'import { initSettingsPage } from "./settings.js";\n' + code

if 'initSettingsPage();' not in code:
    if 'else if (path === "/profile") {' in code:
        code = code.replace(
            'else if (path === "/profile") {\n    renderProfilePage();\n  }',
            'else if (path === "/profile") {\n    renderProfilePage();\n  } else if (path === "/settings") {\n    initSettingsPage();\n  }'
        )

new_profile_func = """function renderProfilePage() {
  const user = getCurrentUser();
  const nameEl = document.getElementById("profile-display-name");
  const idEl = document.getElementById("profile-member-id");
  const coinEl = document.getElementById("profile-coin-balance");
  const avatarWrap = document.getElementById("profile-avatar-badge");
  const copyBtn = document.getElementById("btn-copy-id");

  let guestId = localStorage.getItem("minsplay_guest_id") || "74789317";
  const rawId = user.email ? (user.id || guestId) : guestId;

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
  if (coinEl) coinEl.textContent = (user.coins !== undefined ? user.coins : 10).toString();

  if (avatarWrap) {
    if (user.avatar && (user.avatar.startsWith("http") || (user.avatar.startsWith("/icons/icon-") && user.email))) {
      avatarWrap.innerHTML = `<img src="${user.avatar}" alt="${username}" class="db-avatar-img" onerror="this.src='/icons/icon-192.png';" />`;
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
}
"""

fn_start = code.find("function renderProfilePage")
if fn_start != -1:
    brace_open = code.find("{", fn_start)
    brace_count = 0
    fn_end = brace_open
    for i in range(brace_open, len(code)):
        if code[i] == "{":
            brace_count += 1
        elif code[i] == "}":
            brace_count -= 1
            if brace_count == 0:
                fn_end = i + 1
                break
    code = code[:fn_start] + new_profile_func + code[fn_end:]
else:
    code += "\n" + new_profile_func

with open(router_path, "w", encoding="utf-8") as f:
    f.write(code)
print("  ✓ public/js/router.js patched cleanly.")

css_path = "public/css/pages.css"
with open(css_path, "r", encoding="utf-8") as f:
    css_content = f.read()

if ".db-avatar-initial" not in css_content:
    avatar_css = """
/* Initial circle avatar matching DramaBox Screenshot 1 */
.db-avatar-initial {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #544943;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  font-weight: 700;
  text-transform: lowercase;
}
"""
    with open(css_path, "a", encoding="utf-8") as f:
        f.write(avatar_css)
    print("  ✓ Added .db-avatar-initial styles to public/css/pages.css")
