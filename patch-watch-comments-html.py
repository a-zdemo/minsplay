with open("public/pages/watch.html", "r", encoding="utf-8") as f:
    h = f.read()

# 1. Replace hardcoded 348 with dynamic comment counter
old_btn = """    <button class="rail-action-btn" id="btn-action-comment" type="button">
      <span class="rail-btn-icon">💬</span>
      <span class="rail-btn-label">348</span>
    </button>"""

new_btn = """    <button class="rail-action-btn" id="btn-action-comment" type="button">
      <span class="rail-btn-icon">💬</span>
      <span class="rail-btn-label" id="comment-counter">0</span>
    </button>"""

if old_btn in h:
    h = h.replace(old_btn, new_btn)

# 2. Add Comments Sheet before closing </section>
comments_drawer = """  <!-- Live Episodic Comments Drawer Sheet -->
  <aside class="drawer-modal-backdrop" id="comments-drawer-backdrop" style="display: none;">
    <div class="comments-sheet-box" id="comments-sheet">
      <div class="drawer-drag-pill"></div>
      <header class="drawer-header comments-header">
        <div>
          <h3 class="drawer-heading">Comments (<span id="comments-sheet-count">0</span>)</h3>
        </div>
        <button class="drawer-close-btn" id="btn-close-comments-drawer" type="button">✕</button>
      </header>
      <div class="comments-feed-list" id="comments-feed-list"></div>
      <div class="comments-input-bar">
        <input type="text" id="input-comment-text" class="comments-input-field" placeholder="Share your thoughts..." maxlength="280" />
        <button id="btn-send-comment" class="comments-send-btn" type="button">Send</button>
      </div>
    </div>
  </aside>
</section>"""

if "comments-drawer-backdrop" not in h:
    h = h.replace("</section>", comments_drawer)

with open("public/pages/watch.html", "w", encoding="utf-8") as f:
    f.write(h)
print("  ✓ Step 1 Complete: public/pages/watch.html updated with comments drawer")
