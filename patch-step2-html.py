html = '''<section class="member-page db-member-screen" id="member-page-root">
  <div class="db-member-scroll-body">
    
    <header class="db-member-header">
      <button class="db-back-btn" type="button" data-route="/profile" aria-label="Back">‹</button>
    </header>

    <div class="db-member-hero-art">
      <h1 class="db-member-title">Join Membership</h1>
    </div>

    <!-- Plans Section (Screenshot 2) -->
    <section class="db-membership-plans">
      <!-- Plan 1: Weekly -->
      <article class="db-membership-plan-card selected" data-plan="weekly">
        <span class="db-plan-timer-badge" id="member-timer-text">Discount 00:59:44</span>
        <div class="plan-card-body">
          <div class="plan-radio-circle checked">✓</div>
          <div class="plan-details">
            <h3 class="plan-tier-name">Weekly Membership</h3>
            <div class="plan-price-row">
              <strong class="plan-sale-price">₦6,810.00</strong>
              <span class="plan-orig-price">₦10,000.00</span>
            </div>
            <p class="plan-terms-desc">₦6,810.00/week for the first 3 weeks, then ₦10,000.00/week</p>
          </div>
        </div>
      </article>

      <!-- Plan 2: Annual -->
      <article class="db-membership-plan-card" data-plan="annual">
        <div class="plan-card-body">
          <div class="plan-radio-circle"></div>
          <div class="plan-details">
            <h3 class="plan-tier-name">Annual Membership</h3>
            <div class="plan-price-row">
              <strong class="plan-sale-price">₦83,500.00</strong>
              <span class="plan-period-unit">/year</span>
            </div>
            <span class="plan-purple-badge">Only ₦1,602.00/week</span>
          </div>
        </div>
      </article>
    </section>

    <!-- Why Join Benefits (Screenshot 2) -->
    <section class="db-why-join-section">
      <h3 class="why-join-heading">Why Join?</h3>
      <div class="why-join-list">
        <div class="why-join-item">
          <span class="why-icon">📱</span>
          <div class="why-text">
            <strong>Unlimited access to 16,000+ series</strong>
            <p>100+ fresh dramas every week</p>
          </div>
        </div>
        <div class="why-join-item">
          <span class="why-icon">📥</span>
          <div class="why-text"><strong>Download</strong></div>
        </div>
        <div class="why-join-item">
          <span class="why-icon">⚡</span>
          <div class="why-text"><strong>Daily member points</strong></div>
        </div>
        <div class="why-join-item">
          <span class="why-icon">🎬</span>
          <div class="why-text"><strong>Members-only dramas</strong></div>
        </div>
      </div>
    </section>

    <!-- Sticky Bottom Join Button -->
    <div class="db-member-footer-bar">
      <button class="btn-db-join-now" id="btn-member-join-now" type="button">Join Now</button>
      <span class="db-footer-terms">Auto-renew · Cancel anytime</span>
    </div>

  </div>

  <!-- Google Play Bottom Sheet Modal (Screenshot 3) -->
  <aside class="google-play-modal-backdrop" id="google-play-modal" style="display: none;">
    <div class="google-play-sheet">
      <header class="gp-sheet-header">
        <div class="gp-logo-title">
          <span class="gp-play-icon">▶</span>
          <span class="gp-brand-name">Google Play</span>
        </div>
        <button class="gp-close-btn" id="btn-close-google-play" type="button">✕</button>
      </header>

      <div class="gp-product-row">
        <img src="/icons/icon-192.png" class="gp-app-icon" alt="Minsplay" />
        <div class="gp-product-meta">
          <h4 class="gp-product-name">Membership</h4>
          <span class="gp-app-name">Minsplay - Stream Drama Shorts</span>
        </div>
      </div>

      <div class="gp-pricing-box">
        <div class="gp-price-line active">
          <span>Starting today</span>
          <strong id="gp-price-today">₦6,810.00/week</strong>
        </div>
        <div class="gp-price-line">
          <span id="gp-date-future">Starting Oct 23, 2026</span>
          <strong id="gp-price-future">₦10,000.00/week</strong>
        </div>
      </div>

      <span class="gp-tax-link">See included tax ⓘ</span>

      <ul class="gp-bullet-points">
        <li>• Cancel anytime in Subscriptions on Google Play</li>
        <li>• We'll send you a reminder 2 days before your intro price ends</li>
      </ul>

      <div class="gp-payment-row">
        <div class="gp-card-left">
          <span class="gp-mc-icon">🔴🟡</span>
          <strong>Mastercard-1250</strong>
        </div>
        <span class="gp-chevron">›</span>
      </div>

      <p class="gp-legal-copy">
        By tapping "Subscribe", you agree that your subscription automatically renews until canceled. We'll notify you if your price changes, as described in the Google Play Terms of Service. Learn how to cancel. More
      </p>

      <button class="btn-gp-subscribe" id="btn-google-play-subscribe" type="button">Subscribe</button>
    </div>
  </aside>
</section>
'''

with open("public/pages/member.html", "w", encoding="utf-8") as f:
    f.write(html)
print("Updated public/pages/member.html ✓")
