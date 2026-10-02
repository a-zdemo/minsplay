html = '''<section class="profile-page db-profile-screen" id="profile-page-root">
  <div class="db-profile-scroll-body">
    
    <!-- Top Header (Screenshot 1) -->
    <header class="db-profile-header">
      <div class="db-user-left">
        <div class="db-avatar-wrap guest-silhouette" id="profile-avatar-badge">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <div class="db-user-meta" id="profile-user-clickable" data-route="/auth">
          <div class="db-login-title-row">
            <h2 class="db-username" id="profile-display-name">Log in</h2>
            <span class="db-login-arrow">›</span>
          </div>
          <div class="db-user-subline">
            <span class="db-id-text">ID <strong id="profile-member-id">432655107</strong> <span id="btn-copy-id" style="cursor: pointer;">📋</span></span>
            <span class="db-sub-divider">|</span>
            <span class="db-following-text">Following 0</span>
          </div>
        </div>
      </div>

      <div class="db-top-actions">
        <button class="db-icon-btn" type="button" aria-label="Notifications" data-route="/inbox">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </button>
        <button class="db-icon-btn" type="button" aria-label="Settings" data-route="/settings">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>
    </header>

    <!-- Join Membership Banner Card (Screenshot 1) -->
    <section class="db-vip-banner-card" data-route="/member">
      <span class="db-vip-discount-tag-pink">32% off</span>
      <div class="db-vip-top-row">
        <div class="db-vip-copy">
          <h3 class="db-vip-heading">Join Membership</h3>
          <p class="db-vip-subtext">Enjoy these exclusive benefits:</p>
        </div>
        <button class="db-vip-action-btn-white" type="button" data-route="/member">Join</button>
      </div>

      <div class="db-vip-benefits-grid">
        <div class="db-benefit-col"><span class="db-benefit-symbol">🎬</span><span class="db-benefit-label">16K+ series</span></div>
        <div class="db-benefit-col"><span class="db-benefit-symbol">⚡</span><span class="db-benefit-label">Daily points</span></div>
        <div class="db-benefit-col"><span class="db-benefit-symbol">📥</span><span class="db-benefit-label">Download</span></div>
        <div class="db-benefit-col"><span class="db-benefit-symbol">HD</span><span class="db-benefit-label">1080p quality</span></div>
      </div>
    </section>

    <!-- Creator Spotlight (if creator) -->
    <section class="db-menu-group creator-spotlight-group" id="profile-creator-shelf" style="display: none;">
      <article class="db-menu-row" data-route="/creator">
        <span class="db-row-title" style="color: #ffc107;">Creator Studio 🎬</span>
        <span class="db-chevron">›</span>
      </article>
    </section>

    <!-- Authentic DramaBox Menu Shelf (Screenshot 1) -->
    <section class="db-menu-group">
      <article class="db-menu-row" data-route="/member">
        <span class="db-row-title">Top Up</span>
        <span class="db-chevron">›</span>
      </article>

      <article class="db-menu-row" data-route="/wallet">
        <span class="db-row-title">My Wallet</span>
        <div class="db-row-right">
          <span class="db-coin-indicator">🪙 <strong id="profile-coin-balance">20</strong></span>
          <span class="db-chevron">›</span>
        </div>
      </article>

      <article class="db-menu-row" data-route="/rewards">
        <span class="db-row-title">Earn Rewards</span>
        <span class="db-chevron">›</span>
      </article>

      <article class="db-menu-row" data-route="/gifts">
        <span class="db-row-title">Gifts</span>
        <span class="db-chevron">›</span>
      </article>

      <article class="db-menu-row" data-route="/history">
        <span class="db-row-title">History</span>
        <span class="db-chevron">›</span>
      </article>

      <article class="db-menu-row" data-route="/download">
        <span class="db-row-title">Download</span>
        <span class="db-chevron">›</span>
      </article>
    </section>

    <!-- Bottom Language Section (Screenshot 1) -->
    <section class="db-menu-group">
      <article class="db-menu-row" id="row-language-picker">
        <span class="db-row-title">Language</span>
        <div class="db-row-right">
          <span class="db-settings-val">English</span>
          <span class="db-chevron">›</span>
        </div>
      </article>
    </section>

  </div>
</section>
'''

with open("public/pages/profile.html", "w", encoding="utf-8") as f:
    f.write(html)
print("Updated public/pages/profile.html ✓")
