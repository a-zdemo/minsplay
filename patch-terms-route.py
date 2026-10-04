# 1. Update public/js/router.js
with open("public/js/router.js", "r", encoding="utf-8") as f:
    r = f.read()

# Add import
if 'import termsHtml from "../pages/terms.html?raw";' not in r:
    r = r.replace('import creatorHtml from "../pages/creator.html?raw";', 'import creatorHtml from "../pages/creator.html?raw";\nimport termsHtml from "../pages/terms.html?raw";')

# Add route
if '"/terms": termsHtml,' not in r:
    r = r.replace('"/admin": adminHtml,', '"/admin": adminHtml,\n  "/terms": termsHtml,')

# Add to subpage list
if 'path === "/terms"' not in r:
    r = r.replace('path === "/creator"', 'path === "/terms" || path === "/creator"')

with open("public/js/router.js", "w", encoding="utf-8") as f:
    f.write(r)
print("  ✓ public/js/router.js: /terms route registered")

# 2. Update auth.html to link Terms of Use and Privacy Policy
with open("public/pages/auth.html", "r", encoding="utf-8") as f:
    a = f.read()

old_auth_terms = 'agree to our <a href="#" class="db-legal-link">Terms of Use</a> & <a href="#" class="db-legal-link">Privacy Policy</a>.'
new_auth_terms = 'agree to our <span class="db-legal-link" data-route="/terms" style="cursor:pointer;text-decoration:underline;">Terms of Use</span> & <span class="db-legal-link" data-route="/privacy" style="cursor:pointer;text-decoration:underline;">Privacy Policy</span>.'

if old_auth_terms in a:
    a = a.replace(old_auth_terms, new_auth_terms)
    with open("public/pages/auth.html", "w", encoding="utf-8") as f:
        f.write(a)
    print("  ✓ public/pages/auth.html: Terms of Use link wired")

# 3. Update profile.html footer with Terms link
with open("public/pages/profile.html", "r", encoding="utf-8") as f:
    p = f.read()

old_footer_links = '<span class="db-legal-btn" data-route="/privacy">Privacy Policy</span>\n        <span class="db-legal-dot">•</span>\n        <span class="db-legal-btn" data-route="/deletion">Data Deletion</span>'
new_footer_links = '<span class="db-legal-btn" data-route="/terms">Terms</span>\n        <span class="db-legal-dot">•</span>\n        <span class="db-legal-btn" data-route="/privacy">Privacy</span>\n        <span class="db-legal-dot">•</span>\n        <span class="db-legal-btn" data-route="/deletion">Data Deletion</span>'

if old_footer_links in p:
    p = p.replace(old_footer_links, new_footer_links)
    with open("public/pages/profile.html", "w", encoding="utf-8") as f:
        f.write(p)
    print("  ✓ public/pages/profile.html: Legal footer updated with Terms link")
