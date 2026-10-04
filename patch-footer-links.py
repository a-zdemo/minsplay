# 1. Update public/pages/profile.html with footer links
with open("public/pages/profile.html", "r", encoding="utf-8") as f:
    p = f.read()

footer_markup = """    <!-- Legal Footer Links -->
    <footer class="db-profile-footer">
      <div class="db-legal-links-row">
        <span class="db-legal-btn" data-route="/privacy">Privacy Policy</span>
        <span class="db-legal-dot">•</span>
        <span class="db-legal-btn" data-route="/deletion">Data Deletion</span>
      </div>
      <p class="db-version-pill">v2.4.0 (DramaBox Engine)</p>
    </footer>
  </div>
</section>"""

if "db-legal-links-row" not in p:
    p = p.replace("  </div>\n</section>", footer_markup)
    with open("public/pages/profile.html", "w", encoding="utf-8") as f:
        f.write(p)
    print("  ✓ public/pages/profile.html updated with legal footer links")

# 2. Update public/pages/settings.html: wire Account Deletion row
with open("public/pages/settings.html", "r", encoding="utf-8") as f:
    s = f.read()

old_del = 'id="row-account-deletion">'
new_del = 'id="row-account-deletion" data-route="/deletion">'
if old_del in s and "data-route=\"/deletion\"" not in s:
    s = s.replace(old_del, new_del)
    with open("public/pages/settings.html", "w", encoding="utf-8") as f:
        f.write(s)
    print("  ✓ public/pages/settings.html Account Deletion row wired to /deletion")
