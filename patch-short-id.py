import re

with open("public/js/router.js", "r", encoding="utf-8") as f:
    code = f.read()

new_profile_func = '''function getNumericMemberId(idStr) {
  if (!idStr) return "432655107";
  if (/^\\d{7,10}$/.test(idStr)) return idStr;
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
    hash |= 0;
  }
  return ((Math.abs(hash) % 900000000) + 100000000).toString();
}

function renderProfilePage() {
  const user = getCurrentUser();
  const nameEl = document.getElementById("profile-display-name");
  const idEl = document.getElementById("profile-member-id");
  const coinEl = document.getElementById("profile-coin-balance");
  const creatorShelf = document.getElementById("profile-creator-shelf");
  const copyBtn = document.getElementById("btn-copy-id");
  const avatarWrap = document.getElementById("profile-avatar-badge");

  let guestId = localStorage.getItem("minsplay_guest_id");
  if (!guestId) {
    guestId = Math.floor(100000000 + Math.random() * 900000000).toString();
    localStorage.setItem("minsplay_guest_id", guestId);
  }

  const rawId = user.email ? (user.id || guestId) : guestId;
  const displayId = getNumericMemberId(rawId);

  if (idEl) idEl.textContent = displayId;
  if (nameEl) nameEl.textContent = user.email ? (user.username || "User") : "Log in";
  if (coinEl) coinEl.textContent = (user.coins || 50).toString();
  if (creatorShelf) creatorShelf.style.display = (user.role === ROLES.CREATOR || user.role === ROLES.SUPER_ADMIN) ? "block" : "none";

  if (avatarWrap && user.avatar && (user.avatar.startsWith("http") || user.avatar.startsWith("/"))) {
    avatarWrap.classList.remove("guest-silhouette");
    avatarWrap.innerHTML = `<img src="${user.avatar}" alt="${user.username}" class="db-avatar-img" onerror="this.src='/icons/icon-192.png';" />`;
  }

  if (copyBtn) {
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard?.writeText(displayId);
      showAppToast(`ID ${displayId} copied to clipboard 📋`);
    };
  }
}'''

# Replace the existing renderProfilePage function
code = re.sub(r'function renderProfilePage\(\)\s*\{[\s\S]*?\n\}', new_profile_func, code, count=1)

with open("public/js/router.js", "w", encoding="utf-8") as f:
    f.write(code)

print("Updated public/js/router.js with clean 9-digit DramaBox ID and Google avatar support ✓")
