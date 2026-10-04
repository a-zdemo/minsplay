with open("public/pages/admin.html", "r", encoding="utf-8") as f:
    h = f.read()

# 1. Add tab button
old_nav = '<button class="admin-tab-btn" type="button" data-pane="storage">R2 Storage</button>'
new_nav = '<button class="admin-tab-btn" type="button" data-pane="ads" id="tab-admin-ads" style="display: none;">📢 Ads & AdMob</button>\n      <button class="admin-tab-btn" type="button" data-pane="storage">R2 Storage</button>'

if "tab-admin-ads" not in h and old_nav in h:
    h = h.replace(old_nav, new_nav)

# 2. Add configuration pane markup
admob_pane = """    <!-- TAB 5: AdMob Configuration (Super Admin Exclusive) -->
    <div class="admin-pane" id="pane-ads" style="display: none;">
      <div class="pane-action-bar">
        <span class="pane-subtitle">Google AdMob Configuration & Monetization Engine</span>
        <button id="btn-admob-test-trigger" class="btn-vault-sync-pill" type="button">🎬 Test Ad</button>
      </div>

      <div class="admin-card admob-console-card">
        <div class="admob-status-line">
          <div>
            <strong class="admob-section-title">Global Ad Delivery</strong>
            <p class="admob-section-desc">Enable or disable all ads across Android and Web clients.</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="admob-toggle-enabled" checked />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="admob-status-line" style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px;">
          <div>
            <strong class="admob-section-title">AdMob Test Mode</strong>
            <p class="admob-section-desc">Uses official Google test unit IDs so real accounts are never suspended during QA.</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="admob-toggle-testmode" checked />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="admob-form-group">
          <label class="admob-label" for="admob-input-appid">AdMob App ID</label>
          <input type="text" id="admob-input-appid" class="admob-input" placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX" />
        </div>
      </div>

      <div class="admin-card admob-console-card">
        <h4 class="admob-card-head">🎬 Rewarded Video Ad Units</h4>

        <div class="admob-form-group">
          <label class="admob-label" for="admob-input-rewarded-unlock">Episode Paywall Unlock Unit ID</label>
          <input type="text" id="admob-input-rewarded-unlock" class="admob-input" placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX" />
        </div>

        <div class="admob-row-2col">
          <div class="admob-form-group">
            <label class="admob-label" for="admob-input-unlock-coins">Unlock Coin Equivalent</label>
            <input type="number" id="admob-input-unlock-coins" class="admob-input" value="30" />
          </div>
          <div class="admob-form-group">
            <label class="admob-label" for="admob-input-task-coins">Daily Loop Coin Reward</label>
            <input type="number" id="admob-input-task-coins" class="admob-input" value="20" />
          </div>
        </div>

        <div class="admob-form-group">
          <label class="admob-label" for="admob-input-rewarded-task">Rewards Task Loop Unit ID</label>
          <input type="text" id="admob-input-rewarded-task" class="admob-input" placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX" />
        </div>

        <div class="admob-form-group">
          <label class="admob-label" for="admob-input-task-limit">Daily Rewarded Ad Limit (Views / Day)</label>
          <input type="number" id="admob-input-task-limit" class="admob-input" value="15" />
        </div>
      </div>

      <div class="admin-card admob-console-card">
        <h4 class="admob-card-head">⚡ Interstitial & Banner Units</h4>

        <div class="admob-form-group">
          <label class="admob-label" for="admob-input-interstitial">Episode Transition Interstitial Unit ID</label>
          <input type="text" id="admob-input-interstitial" class="admob-input" placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX" />
        </div>

        <div class="admob-form-group">
          <label class="admob-label" for="admob-input-interstitial-freq">Frequency (Show every N episodes)</label>
          <input type="number" id="admob-input-interstitial-freq" class="admob-input" value="3" min="1" max="10" />
        </div>

        <div class="admob-form-group">
          <label class="admob-label" for="admob-input-banner">Adaptive Banner Unit ID</label>
          <input type="text" id="admob-input-banner" class="admob-input" placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX" />
        </div>
      </div>

      <div class="admob-save-bar">
        <button type="button" id="btn-admob-reset-defaults" class="btn-admob-secondary">Reset Test Defaults</button>
        <button type="button" id="btn-admob-save-config" class="btn-admob-primary">Save AdMob Settings 💾</button>
      </div>
    </div>
"""

if "pane-ads" not in h:
    h = h.replace('<!-- TAB 4: Cloudflare R2 Storage -->', admob_pane + '\n    <!-- TAB 4: Cloudflare R2 Storage -->')

with open("public/pages/admin.html", "w", encoding="utf-8") as f:
    f.write(h)
print("  ✓ public/pages/admin.html updated with AdMob management pane")
