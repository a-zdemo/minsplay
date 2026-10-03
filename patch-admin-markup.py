html = '''<section class="db-subpage admin-page" id="admin-page-root">
  <div class="db-subpage-body admin-body">
    <header class="db-subpage-header admin-header">
      <button class="db-back-btn" type="button" data-route="/profile" aria-label="Back">‹</button>
      <div class="admin-title-wrap">
        <h2 class="db-subpage-title">Moderation Center</h2>
        <span class="admin-security-pill" id="admin-role-badge">👑 SUPER ADMIN</span>
      </div>
      <button class="admin-refresh-btn" id="btn-admin-refresh" type="button" title="Refresh">↻</button>
    </header>

    <section class="admin-metrics-grid">
      <div class="admin-metric-card">
        <span class="metric-label">Vault Dramas</span>
        <strong class="metric-val" id="metric-total-dramas">2</strong>
        <span class="metric-sub">Catalog</span>
      </div>
      <div class="admin-metric-card">
        <span class="metric-label">Creator Apps</span>
        <strong class="metric-val danger" id="count-creator-requests-metric">0</strong>
        <span class="metric-sub">Pending</span>
      </div>
      <div class="admin-metric-card">
        <span class="metric-label">Platform Users</span>
        <strong class="metric-val" id="metric-total-users">3</strong>
        <span class="metric-sub">Registered</span>
      </div>
    </section>

    <nav class="admin-nav-tabs" id="admin-nav-tabs">
      <button class="admin-tab-btn active" type="button" data-pane="dramas">Content Vault</button>
      <button class="admin-tab-btn" type="button" data-pane="creator-requests" id="tab-creator-requests">Creator Requests (<span id="count-creator-requests">0</span>)</button>
      <button class="admin-tab-btn" type="button" data-pane="roles" id="tab-admin-roles" style="display: none;">👑 Users & Roles</button>
      <button class="admin-tab-btn" type="button" data-pane="storage">R2 Storage</button>
    </nav>

    <!-- TAB 1: Dramas -->
    <div class="admin-pane active" id="pane-dramas">
      <div class="pane-action-bar"><span class="pane-subtitle" id="admin-catalog-count">2 Registered Dramas</span></div>
      <div class="admin-items-feed" id="admin-dramas-feed"></div>
    </div>

    <!-- TAB 2: Creator Requests -->
    <div class="admin-pane" id="pane-creator-requests" style="display: none;">
      <div class="pane-action-bar"><span class="pane-subtitle">Pending Creator Studio Applications</span></div>
      <div class="admin-items-feed" id="admin-creator-apps-feed"></div>
    </div>

    <!-- TAB 3: Users & Roles (Live Supabase Directory) -->
    <div class="admin-pane" id="pane-roles" style="display: none;">
      <div class="pane-action-bar">
        <span class="pane-subtitle">Live Supabase Registered Users</span>
        <span class="users-found-pill" id="users-total-found">3 Total</span>
      </div>

      <!-- Real-time Search & Page Size Filter -->
      <div class="admin-users-filter-bar">
        <div class="users-search-box">
          <input type="search" id="input-search-platform-users" class="users-search-input" placeholder="Search email or user ID..." />
        </div>
        <select id="select-users-page-size" class="users-pagesize-select">
          <option value="10">10 / page</option>
          <option value="20" selected>20 / page</option>
          <option value="50">50 / page</option>
          <option value="100">100 / page</option>
        </select>
      </div>

      <!-- Live Users Feed -->
      <div class="admin-items-feed" id="admin-users-roles-feed">
        <div class="admin-empty-state"><p>Loading registered users from Supabase...</p></div>
      </div>

      <!-- Pagination Nav Footer -->
      <div class="users-pagination-bar" id="users-pagination-bar">
        <button class="btn-users-page" id="btn-users-prev" type="button">‹ Prev</button>
        <span class="users-page-indicator" id="users-page-indicator">Page 1 of 1</span>
        <button class="btn-users-page" id="btn-users-next" type="button">Next ›</button>
      </div>
    </div>

    <!-- TAB 4: Cloudflare R2 Storage -->
    <div class="admin-pane" id="pane-storage" style="display: none;">
      <div class="admin-card r2-health-card">
        <h4 class="card-title">Cloudflare R2 Media Vault</h4>
        <p class="card-desc">Public Domain: <code>https://pub-446cc5245dc94ce0afede5f9a591d746.r2.dev</code></p>
        <div class="r2-status-pill">● Direct Video Gateway Online</div>
        <button class="btn-admin-outline" id="btn-test-r2-ping" type="button">Test R2 Gateway Ping</button>
      </div>
    </div>
  </div>
</section>'''

with open("public/pages/admin.html", "w", encoding="utf-8") as f:
    f.write(html)
print("  ✓ Step 2 Complete: public/pages/admin.html updated with Search & Pagination UI")
