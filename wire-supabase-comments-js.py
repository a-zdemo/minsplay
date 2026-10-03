comments_js_code = '''import { fetchEpisodeComments, postEpisodeComment, likeEpisodeComment } from "./comments-api.js";
import { getCurrentUser } from "./auth.js";

let activeSeriesId = "the-beginning";
let activeEpisodeId = 1;

export async function openCommentsDrawer(seriesId = "the-beginning", episodeId = 1) {
  activeSeriesId = seriesId;
  activeEpisodeId = episodeId;
  ensureDrawerMarkup();

  const backdrop = document.getElementById("comments-drawer-backdrop");
  const sheet = document.getElementById("comments-drawer-sheet");

  await renderLiveComments();

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

async function renderLiveComments() {
  const container = document.getElementById("comments-list-container");
  const countBadge = document.getElementById("comments-total-badge");
  const railBadge = document.getElementById("comment-counter");

  const comments = await fetchEpisodeComments(activeSeriesId, activeEpisodeId);
  const countStr = comments.length.toString();

  if (countBadge) countBadge.textContent = countStr;
  if (railBadge) railBadge.textContent = countStr;
  if (!container) return;

  if (comments.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:36px;color:rgba(255,255,255,0.4);"><p>No comments yet.<br>Be the first test user to share a reaction!</p></div>`;
    return;
  }

  container.innerHTML = comments.map((c) => `
    <article class="comment-item" data-comment-id="${c.id}">
      <img class="comment-avatar-bubble" src="${c.avatar || '/icons/icon-192.png'}" onerror="this.src='/icons/icon-192.png';" alt="${c.username}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" />
      <div class="comment-body">
        <div class="comment-top-row">
          <strong class="comment-username">${c.username}</strong>
          <span class="comment-time">${new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <p class="comment-content">${c.content}</p>
      </div>
      <button class="comment-like-btn" type="button" data-cid="${c.id}" data-likes="${c.likes || 0}">
        <span class="comment-like-heart">♥</span>
        <span class="comment-like-num">${c.likes || 0}</span>
      </button>
    </article>
  `).join("");
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
          <input type="text" class="comments-input-field" id="comments-input-field" placeholder="Add a drama reaction..." maxlength="280" />
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

  if (backdrop) backdrop.onclick = (e) => { if (e.target === backdrop) closeCommentsDrawer(); };
  if (closeBtn) closeBtn.onclick = closeCommentsDrawer;

  async function submitComment() {
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    const curUser = getCurrentUser();
    sendBtn.disabled = true;
    await postEpisodeComment({ seriesId: activeSeriesId, episodeId: activeEpisodeId, content: text, user: curUser });
    input.value = "";
    sendBtn.disabled = false;
    await renderLiveComments();
  }

  if (sendBtn) sendBtn.onclick = submitComment;
  if (input) input.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); submitComment(); } };

  if (list) {
    list.onclick = async (e) => {
      const btn = e.target.closest("[data-cid]");
      if (!btn) return;
      const cid = btn.getAttribute("data-cid");
      const likes = parseInt(btn.getAttribute("data-likes"), 10) || 0;
      await likeEpisodeComment(cid, likes);
      await renderLiveComments();
    };
  }
}

export function initCommentsSystem() {
  ensureDrawerMarkup();
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest('#btn-action-comment, [data-action="comment"]');
    if (!trigger) return;
    e.preventDefault();
    e.stopPropagation();

    const slide = trigger.closest(".foryou-slide");
    const seriesId = slide ? slide.getAttribute("data-series-id") : (new URLSearchParams(window.location.search).get("id") || "the-beginning");
    const epId = new URLSearchParams(window.location.search).get("ep") || 1;
    openCommentsDrawer(seriesId, parseInt(epId, 10));
  }, true);
}
'''

with open("public/js/comments.js", "w", encoding="utf-8") as f:
    f.write(comments_js_code)
print("  ✓ public/js/comments.js updated: Hardcoded seeds cleared, wired to live Supabase")
