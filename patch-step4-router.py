with open("public/js/router.js", "r", encoding="utf-8") as f:
    router_js = f.read()

# 1. Add import for member page
if "initMemberPage" not in router_js:
    router_js = 'import { initMemberPage } from "./member.js";\n' + router_js

# 2. Add profile rendering helper
profile_helper = '''
function renderProfilePage() {
  const user = getCurrentUser();
  const nameEl = document.getElementById("profile-display-name");
  const idEl = document.getElementById("profile-member-id");
  const coinEl = document.getElementById("profile-coin-balance");
  const creatorShelf = document.getElementById("profile-creator-shelf");
  const copyBtn = document.getElementById("btn-copy-id");

  let guestId = localStorage.getItem("minsplay_guest_id");
  if (!guestId) {
    guestId = Math.floor(100000000 + Math.random() * 900000000).toString();
    localStorage.setItem("minsplay_guest_id", guestId);
  }

  if (idEl) idEl.textContent = user.email ? (user.id || guestId) : guestId;
  if (nameEl) nameEl.textContent = user.email ? user.username : "Log in";
  if (coinEl) coinEl.textContent = getUserCoins().toString();
  if (creatorShelf) creatorShelf.style.display = (user.role === ROLES.CREATOR || user.role === ROLES.SUPER_ADMIN) ? "block" : "none";

  if (copyBtn) {
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      const textToCopy = idEl ? idEl.textContent : guestId;
      navigator.clipboard?.writeText(textToCopy);
      showAppToast(`ID ${textToCopy} copied to clipboard 📋`);
    };
  }
}
'''

if "renderProfilePage()" not in router_js:
    router_js = profile_helper + "\n" + router_js
    router_js = router_js.replace(
        'else if (path === "/download") {\n    renderDownloadPage();\n  }',
        'else if (path === "/download") {\n    renderDownloadPage();\n  } else if (path === "/profile") {\n    renderProfilePage();\n  } else if (path === "/member") {\n    initMemberPage();\n  }'
    )

with open("public/js/router.js", "w", encoding="utf-8") as f:
    f.write(router_js)
print("Updated public/js/router.js with member and profile controllers ✓")
