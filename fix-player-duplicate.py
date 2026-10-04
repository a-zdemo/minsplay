with open("public/js/player.js", "r", encoding="utf-8") as f:
    p = f.read()

# 1. Ensure the top declaration checks both admob and fallback button IDs
p = p.replace(
    'const unlockAdBtn = document.getElementById("btn-unlock-mock");',
    'const unlockAdBtn = document.getElementById("btn-unlock-admob") || document.getElementById("btn-unlock-mock");'
)

# 2. Remove the duplicate 'const' declaration at line 237
p = p.replace(
    '  // REWARDED AD: Unlock via AdMob\n  const unlockAdBtn = document.getElementById("btn-unlock-admob") || document.getElementById("btn-unlock-mock");\n  if (unlockAdBtn) {',
    '  // REWARDED AD: Unlock via AdMob\n  if (unlockAdBtn) {'
)

with open("public/js/player.js", "w", encoding="utf-8") as f:
    f.write(p)
print("  ✓ Fixed duplicate unlockAdBtn declaration in public/js/player.js")
