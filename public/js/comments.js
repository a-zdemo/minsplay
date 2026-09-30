const COMMENTS_KEY_PREFIX = "minsplay_comments_";

const SEED_COMMENTS = {
  "the-beginning": [
    { id: "c1", user: "DramaQueen_99", avatar: "👑", text: "He has no idea who he's messing with!! The ending of this episode gave me chills 🥶", likes: 142, liked: false, time: "2h ago" },
    { id: "c2", user: "Marcus_V", avatar: "⚡", text: "Best cliffhanger yet. Ep 3 better show the retribution! 🔥", likes: 89, liked: false, time: "4h ago" },
    { id: "c3", user: "ShortDramaLover", avatar: "🍿", text: "I said I'd only watch 1 episode and now it's 2 AM help 😭💀", likes: 215, liked: false, time: "6h ago" },
    { id: "c4", user: "Elena_R", avatar: "✨", text: "The mother-in-law's face when the truth comes out is going to be PRICELESS.", likes: 64, liked: false, time: "8h ago" }
  ],
  "master-of-dragons": [
    { id: "c1", user: "DragonSlayer", avatar: "🐉", text: "5 years in the abyss and he's finally back! That entrance was pure cinema.", likes: 310, liked: false, time: "1h ago" },
    { id: "c2", user: "C-DramaAddict", avatar: "⚔️", text: "Bro did NOT just shatter the jade seal with one hand 🤯", likes: 178, liked: false, time: "3h ago" },
    { id: "c3", user: "Viper23", avatar: "🔥", text: "Every villain in this city is about to get taught a lesson lol", likes: 95, liked: false, time: "5h ago" }
  ],
  "default": [
    { id: "c1", user: "BingeWatcherX", avatar: "🎬", text: "I need the next episode IMMEDIATELY. Why are these so addictive?!", likes: 128, liked: false, time: "2h ago" },
    { id: "c2", user: "Sarah_K", avatar: "💖", text: "The female lead is so smart for seeing right through his fake act 😂", likes: 74, liked: false, time: "3h ago" },
    { id: "c3", user: "ReelFanatic", avatar: "⚡", text: "The production quality on this is crazy good for vertical format!", likes: 52, liked: false, time: "5h ago" },
    { id: "c4", user: "Leo_M", avatar: "🥊", text: "Never underestimate an underdog. That slap was so satisfying.", likes: 91, liked: false, time: "7h ago" }
  ]
};

let activeSeriesId = "the-beginning";
let activeEpisodeId = 1;

export function getCommentsForSeries(seriesId) {
  try {
    const stored = localStorage.getItem(COMMENTS_KEY_PREFIX + seriesId);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  const seeds = SEED_COMMENTS[seriesId] || SEED_COMMENTS["default"];
  localStorage.setItem(COMMENTS_KEY_PREFIX + seriesId, JSON.stringify(seeds));
  return seeds;
}

function saveCommentsForSeries(seriesId, comments) {
  try {
    localStorage.setItem(COMMENTS_KEY_PREFIX + seriesId, JSON.stringify(comments));
  } catch (e) {}
}

function renderCommentsList(comments) {
  const container = document.getElementById("comments-list-container");
  const countBadge = document.getElementById("comments-total-badge");
  if (!container) return;

  if (countBadge) countBadge.textContent = comments.length.toString();

  container.innerHTML = comments.map((c) => `
    <article class="comment-item" data-comment-id="${c.id}">
      <div class="comment-avatar-bubble">${c.avatar}</div>
      <div class="comment-body">
        <div class="comment-top-row">
          <strong class="comment-username">${c.user}</strong>
          <span class="comment-time">${c.time}</span>
        </div>
        <p class="comment-content">${c.text}</p>
      </div>
      <button class="comment-like-btn ${c.liked ? 'liked' : ''}" type="button" data-comment-like="${c.id}">
        <span class="comment-like-heart">${c.liked ? '♥' : '♡'}</span>
        <span class="comment-like-num">${c.likes}</span>
      </button>
    </article>
  `).join("");
}

export function openCommentsDrawer(seriesId = "the-beginning", episodeId = 1) {
  activeSeriesId = seriesId;
  activeEpisodeId = episodeId;
  ensureDrawerMarkup();

  const backdrop = document.getElementById("comments-drawer-backdrop");
  const sheet = document.getElementById("comments-drawer-sheet");
  const comments = getCommentsForSeries(seriesId);

  renderCommentsList(comments);

  if (backdrop && sheet) {
    backdrop.style.display = "block";
    requestAnimationFrame(() => {
      backdrop.classList.add("visible");
      sheet.classList.add("open");
    });
  }
}

export function closeCommentsDrawer() {
  const backdrop = document.getElementById("comments-drawer-backdrop");
  const sheet = document.getElementById("comments-drawer-sheet");
  if (backdrop && sheet) {
    sheet.classList.remove("open");
    backdrop.classList.remove("visible");
    setTimeout(() => { backdrop.style.display = "none"; }, 250);
  }
}

function ensureDrawerMarkup() {
  if (document.getElementById("comments-drawer-backdrop")) return;

  const drawerWrap = document.createElement("div");
  drawerWrap.innerHTML = `
    <aside class="comments-drawer-backdrop" id="comments-drawer-backdrop" style="display: none;">
      <div class="comments-drawer-sheet" id="comments-drawer-sheet">
        <div class="comments-drag-pill"></div>
        <header class="comments-header">
          <div class="comments-title-wrap">
            <h3 class="comments-heading">Comments</h3>
            <span class="comments-pill-count" id="comments-total-badge">0</span>
          </div>
          <button class="comments-close-btn" id="btn-close-comments" type="button" aria-label="Close">✕</button>
        </header>

        <div class="comments-list" id="comments-list-container"></div>

        <footer class="comments-input-bar">
          <div class="comments-avatar-preview">🐜</div>
          <input type="text" class="comments-input-field" id="comments-input-field" placeholder="Add a drama reaction..." maxlength="180" />
          <button class="comments-send-btn" id="btn-send-comment" type="button" aria-label="Post">➤</button>
        </footer>
      </div>
    </aside>
  `;
  document.body.appendChild(drawerWrap.firstElementChild);

  const backdrop = document.getElementById("comments-drawer-backdrop");
  const closeBtn = document.getElementById("btn-close-comments");
  const sendBtn = document.getElementById("btn-send-comment");
  const input = document.getElementById("comments-input-field");
  const list = document.getElementById("comments-list-container");

  if (backdrop) {
    backdrop.onclick = (e) => { if (e.target === backdrop) closeCommentsDrawer(); };
  }
  if (closeBtn) closeBtn.onclick = closeCommentsDrawer;

  function submitComment() {
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const comments = getCommentsForSeries(activeSeriesId);
    const newComment = {
      id: "usr_" + Date.now(),
      user: "Minsplay Viewer (You)",
      avatar: "🐜",
      text,
      likes: 0,
      liked: false,
      time: "Just now"
    };

    comments.unshift(newComment);
    saveCommentsForSeries(activeSeriesId, comments);
    renderCommentsList(comments);
    input.value = "";
    if (list) list.scrollTop = 0;
  }

  if (sendBtn) sendBtn.onclick = submitComment;
  if (input) {
    input.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); submitComment(); } };
  }

  if (list) {
    list.onclick = (e) => {
      const likeBtn = e.target.closest("[data-comment-like]");
      if (!likeBtn) return;
      const cId = likeBtn.getAttribute("data-comment-like");
      const comments = getCommentsForSeries(activeSeriesId);
      const target = comments.find((c) => c.id === cId);
      if (target) {
        target.liked = !target.liked;
        target.likes += target.liked ? 1 : -1;
        saveCommentsForSeries(activeSeriesId, comments);
        renderCommentsList(comments);
      }
    };
  }
}

export function initCommentsSystem() {
  ensureDrawerMarkup();

  // Capture phase listener catches comment clicks on Player (/watch) & Reels (/foryou)
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest('#btn-action-comment, [data-action="comment"]');
    if (!trigger) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const slide = trigger.closest(".foryou-slide");
    const seriesId = slide ? slide.getAttribute("data-series-id") : (new URLSearchParams(window.location.search).get("id") || "the-beginning");
    const epId = new URLSearchParams(window.location.search).get("ep") || 1;

    openCommentsDrawer(seriesId, parseInt(epId, 10));
  }, true);
}
