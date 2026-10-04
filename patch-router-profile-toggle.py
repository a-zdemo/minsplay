with open("public/js/router.js", "r", encoding="utf-8") as f:
    r = f.read()

toggle_logic = """  // Dynamic Role Dashboard Shelves
  const staffShelf = document.getElementById("profile-staff-shelf");
  const staffTitle = document.getElementById("profile-staff-title");
  const creatorShelf = document.getElementById("profile-creator-shelf");

  const isSuper = user.role === ROLES.SUPER_ADMIN;
  const isAdmin = user.role === ROLES.ADMIN || isSuper;
  const isCreator = user.role === ROLES.CREATOR || isSuper;

  if (staffShelf) {
    staffShelf.style.display = isAdmin ? "block" : "none";
    if (staffTitle) staffTitle.textContent = isSuper ? "👑 Super Admin Console" : "🛡️ Admin Console";
  }
  if (creatorShelf) {
    creatorShelf.style.display = isCreator ? "block" : "none";
  }
"""

anchor = 'if (idEl) idEl.textContent = numericId;'
if "profile-staff-shelf" not in r and anchor in r:
    r = r.replace(anchor, toggle_logic + "\n  " + anchor)
    with open("public/js/router.js", "w", encoding="utf-8") as f:
        f.write(r)
    print("  ✓ Step 3 Complete: router.js now toggles dashboard shelves based on user role")
else:
    print("  ✓ Step 3: Already wired")
