with open("public/pages/profile.html", "r", encoding="utf-8") as f:
    h = f.read()

shelves = """    <!-- Dynamic Role-Based Staff & Creator Shelves -->
    <section class="db-menu-group db-staff-shelf" id="profile-staff-shelf" style="display: none;">
      <article class="db-menu-row" data-route="/admin">
        <div class="db-row-left-cluster">
          <span class="db-role-bubble admin">🛡️</span>
          <div>
            <strong class="db-row-title" id="profile-staff-title">Admin Console</strong>
            <span class="db-row-subtitle">Moderation, creator apps & users</span>
          </div>
        </div>
        <span class="db-chevron">›</span>
      </article>
    </section>

    <section class="db-menu-group db-creator-shelf" id="profile-creator-shelf" style="display: none;">
      <article class="db-menu-row" data-route="/creator">
        <div class="db-row-left-cluster">
          <span class="db-role-bubble creator">🎬</span>
          <div>
            <strong class="db-row-title">Creator Studio</strong>
            <span class="db-row-subtitle">Upload episodes & track analytics</span>
          </div>
        </div>
        <span class="db-chevron">›</span>
      </article>
    </section>

    <!-- DramaBox Navigation Shelf (Screenshot 1) -->"""

marker = "    <!-- DramaBox Navigation Shelf (Screenshot 1) -->"
if "profile-staff-shelf" not in h and marker in h:
    h = h.replace(marker, shelves)
    with open("public/pages/profile.html", "w", encoding="utf-8") as f:
        f.write(h)
    print("  ✓ Step 2 Complete: Staff & Creator dashboard shelves added to profile.html")
else:
    print("  ✓ Step 2: Already up to date")
