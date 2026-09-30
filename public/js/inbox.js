const COMMENTS_KEY_PREFIX = "minsplay_comments_";

export function initInboxSubViews() {
  document.addEventListener("click", (e) => {
    // 1. Open My Activity (Pic 1)
    if (e.target.closest("#btn-inbox-activity")) {
      switchInboxView("view-inbox-activity");
      renderUserActivityComments();
      return;
    }

    // 2. Open Interactions (Pic 2)
    if (e.target.closest("#btn-inbox-interactions")) {
      switchInboxView("view-inbox-interactions");
      return;
    }

    // 3. Back button inside My Activity / Interactions returns to My Inbox list
    if (e.target.closest(".db-inbox-sub-back")) {
      switchInboxView("view-inbox-main");
      return;
    }

    // 4. Tab Pill selection (Comments / Ratings / Bullet Comments)
    const pill = e.target.closest(".db-pill-btn");
    if (pill) {
      const container = pill.closest(".db-tab-pills-row");
      if (container) {
        container.querySelectorAll(".db-pill-btn").forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
      }
    }
  });
}

function switchInboxView(viewId) {
  const allViews = document.querySelectorAll(".db-inbox-view-pane");
  allViews.forEach((v) => {
    v.style.display = "none";
    v.classList.remove("active");
  });

  const target = document.getElementById(viewId);
  if (target) {
    target.style.display = "flex";
    target.classList.add("active");
    window.scrollTo(0, 0);
  }
}

function renderUserActivityComments() {
  const container = document.getElementById("activity-feed-container");
  if (!container) return;

  // Gather comments created by this user across all dramas
  let myComments = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(COMMENTS_KEY_PREFIX)) {
        const list = JSON.parse(localStorage.getItem(key) || "[]");
        const authored = list.filter((c) => c.user && c.user.includes("You"));
        myComments.push(...authored);
      }
    }
  } catch (err) {}

  if (myComments.length === 0) {
    container.innerHTML = `
      <div class="db-empty-state-box">
        <div class="db-tray-icon-wrap">
          <svg width="90" height="74" viewBox="0 0 96 76" fill="none">
            <path d="M42 16L43.2 19.8L47 21L43.2 22.2L42 26L40.8 22.2L37 21L40.8 19.8L42 16Z" fill="#52525e" opacity="0.6"/>
            <path d="M72 30L72.8 32.2L75 33L72.8 33.8L72 36L71.2 33.8L69 33L71.2 32.2L72 30Z" fill="#52525e" opacity="0.6"/>
            <circle cx="56" cy="22" r="13" fill="#32323e"/>
            <polygon points="53,16 63,22 53,28" fill="#202028"/>
            <path d="M26 38L32 24H68L74 38H26Z" fill="#1e1e26"/>
            <path d="M20 38H80L75 64H25L20 38Z" fill="#2a2a36" stroke="#3a3a48" stroke-width="1.5"/>
            <rect x="42" y="47" width="16" height="4" rx="2" fill="#16161e"/>
          </svg>
        </div>
        <p class="db-empty-desc">You haven't posted anything yet.</p>
      </div>
    `;
  } else {
    container.innerHTML = myComments.map((c) => `
      <article class="db-user-comment-card">
        <div class="db-user-comment-top">
          <span>💬 Comment</span>
          <span>${c.time || 'Recent'} • ♥ ${c.likes || 0}</span>
        </div>
        <p class="db-user-comment-body">${c.text}</p>
      </article>
    `).join("");
  }
}
