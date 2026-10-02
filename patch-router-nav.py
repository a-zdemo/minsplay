with open("public/js/router.js", "r", encoding="utf-8") as f:
    code = f.read()

# Add /member to isSubpage list to hide bottom navigation bar
old_subpage = 'path === "/download" ||'
new_subpage = 'path === "/download" || path === "/member" ||'

if 'path === "/member" ||' not in code:
    code = code.replace(old_subpage, new_subpage)
    with open("public/js/router.js", "w", encoding="utf-8") as f:
        f.write(code)
    print("Fixed router.js: /member now hides bottom nav bar ✓")
else:
    print("router.js already hides bottom nav on /member.")
