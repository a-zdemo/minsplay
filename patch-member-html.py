html = '''<section class="member-page db-member-screen" id="member-page-root">
  <div class="db-member-scroll-body">
    
    <header class="db-member-top-nav">
      <button class="db-back-btn" type="button" data-route="/profile" aria-label="Back">‹</button>
      <h2 class="db-member-nav-title">Join Membership</h2>
      <div style="width: 32px;"></div>
    </header>

    <!-- Plans Section -->
    <section class="db-membership-plans">
      <!-- Weekly -->
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

      <!-- Annual -->
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

    <!-- Why Join Complete List -->
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
        <div class="why-join-item"><span class="why-icon">📥</span><div class="why-text"><strong>Download</strong></div></div>
        <div class="why-join-item"><span class="why-icon">⚡</span><div class="why-text"><strong>Daily member points</strong></div></div>
        <div class="why-join-item"><span class="why-icon">🎬</span><div class="why-text"><strong>Members-only dramas</strong></div></div>
        <div class="why-join-item"><span class="why-icon">📺</span><div class="why-text"><strong>1080p quality</strong></div></div>
        <div class="why-join-item"><span class="why-icon">🎁</span><div class="why-text"><strong>Gift dramas to friends</strong><p>3 times weekly</p></div></div>
        <div class="why-join-item"><span class="why-icon">🎀</span><div class="why-text"><strong>Gift a membership to a friend</strong><p>Once weekly</p></div></div>
        <div class="why-join-item"><span class="why-icon">🎨</span><div class="why-text"><strong>Members-only themes</strong><p>Members can change theme in Settings</p></div></div>
        <div class="why-join-item"><span class="why-icon">🚫</span><div class="why-text"><strong>Ad-free</strong></div></div>
      </div>
    </section>

    <!-- Members-Only Dramas Showcase -->
    <section class="db-member-showcase-section">
      <h3 class="why-join-heading">Members-only dramas</h3>
      <div class="db-member-posters-scroll" id="member-dramas-scroll">
        <article class="member-drama-poster-card" data-route="/watch" data-series="the-dark-bees" data-episode="1">
          <div class="member-poster-thumb art-gold"><span class="art-symbol">👑</span></div>
          <strong class="member-poster-title">The Dominant Heir</strong>
        </article>
        <article class="member-drama-poster-card" data-route="/watch" data-series="the-beginning" data-episode="1">
          <div class="member-poster-thumb art-blue"><span class="art-symbol">⚡</span></div>
          <strong class="member-poster-title">Reveal, Rise & Reign</strong>
        </article>
        <article class="member-drama-poster-card" data-route="/watch" data-series="master-of-dragons" data-episode="1">
          <div class="member-poster-thumb art-crimson"><span class="art-symbol">🐉</span></div>
          <strong class="member-poster-title">Crowned in Love</strong>
        </article>
      </div>
    </section>

    <!-- Coming Soon Section -->
    <section class="db-coming-soon-section">
      <div class="coming-soon-header">
        <h3 class="why-join-heading">Coming Soon</h3>
        <span class="coming-soon-date"><span class="cs-dot">▶</span> 10/5</span>
      </div>
      <div class="coming-soon-grid">
        <div class="cs-card">
          <div class="cs-thumb art-purple"><span class="cs-badge">Minsplay Exclusive</span></div>
          <button class="btn-remind-me" type="button" data-drama="devil-king">⏰ Remind Me</button>
        </div>
        <div class="cs-card">
          <div class="cs-thumb art-dark"><span class="cs-badge">Minsplay Exclusive</span></div>
          <button class="btn-remind-me" type="button" data-drama="star-warmaster">⏰ Remind Me</button>
        </div>
        <div class="cs-card">
          <div class="cs-thumb art-emerald"><span class="cs-badge">Minsplay Exclusive</span></div>
          <button class="btn-remind-me" type="button" data-drama="adored-dragon">⏰ Remind Me</button>
        </div>
      </div>
    </section>

    <!-- Tips Section (Verbatim Points 1-9) -->
    <section class="db-member-tips-section">
      <h4 class="tips-heading">Tips</h4>
      <ol class="tips-list">
        <li>Minsplay features both free and paid content for everyone.</li>
        <li>Paid content can be unlocked using coins or by subscribing to a membership. Membership-only content can only be accessed after subscribing to a membership.</li>
        <li>Coins will be used first when unlocking episodes. If the amount is insufficient, reward coins will automatically be used.</li>
        <li>During the subscription period, you will have unlimited access to all the series on Minsplay.</li>
        <li>Your Google Play account will be automatically charged and your subscription will be renewed within 24 hours before the end of the current subscription period.</li>
        <li>To cancel the subscription, please go to your Google Play account management and cancel at least 24 hours before the end of the current subscription period.</li>
        <li>If a top-up payment has been made successfully but your balance is not updated, please try clicking "Restore" to refresh your balance.</li>
        <li>If you have any other questions, please reach out to our online customer service via "Profile" - "Help & feedback".</li>
        <li>Coins and ongoing memberships are non-refundable and non-exchangeable once they are used.</li>
      </ol>
      <p class="tips-link-text">If you want to manage your Minsplay subscription, please go to <a href="https://play.google.com/store/account/subscriptions" target="_blank" rel="noopener" class="tips-gp-link">Google Subscription Management</a>.</p>
    </section>

    <!-- Sticky Bottom Join Button -->
    <div class="db-member-footer-bar">
      <button class="btn-db-join-now" id="btn-member-join-now" type="button">Join Now</button>
      <span class="db-footer-terms">Auto-renew · Cancel anytime</span>
    </div>

  </div>
</section>
'''
with open("public/pages/member.html", "w", encoding="utf-8") as f:
    f.write(html)
print("Updated public/pages/member.html with complete DramaBox layout ✓")
