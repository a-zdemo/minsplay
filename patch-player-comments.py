with open("public/js/player.js", "r", encoding="utf-8") as f:
    p = f.read()

# 1. Add import
if 'from "./comments-api.js"' not in p:
    p = 'import { fetchEpisodeComments, postEpisodeComment, likeEpisodeComment } from "./comments-api.js";\nimport { getCurrentUser } from "./auth.js";\n' + p

# 2. Add comments wiring helper
comments_fn = """
  // Live Comments Drawer Controls
  const commentBtn = document.getElementById("btn-action-comment");
  const commentCounter = document.getElementById("comment-counter");
  const commentsBackdrop = document.getElementById("comments-drawer-backdrop");
  const closeCommentsBtn = document.getElementById("btn-close-comments-drawer");
  const commentsFeed = document.getElementById("comments-feed-list");
  const commentsCountHeader = document.getElementById("comments-sheet-count");
  const commentInput = document.getElementById("input-comment-text");
  const sendCommentBtn = document.getElementById("btn-send-comment");

  async function syncCommentsForCurrentEpisode() {
    if (!currentSeries) return;
    const ep = currentEpisodes[currentEpisodeIndex];
    if (!ep) return;
    const comments = await fetchEpisodeComments(currentSeries.id, ep.id);
    if (commentCounter) commentCounter.textContent = comments.length.toString();
    if (commentsCountHeader) commentsCountHeader.textContent = comments.length.toString();
    if (commentsFeed) {
      if (comments.length === 0) {
        commentsFeed.innerHTML = '<div style="text-align:center;padding:36px;color:rgba(255,255,255,0.4);"><p>No comments yet.<br>Be the first to share your thoughts!</p></div>';
      } else {
        commentsFeed.innerHTML = comments.map(c => `
          <div class="comment-item">
            <img class="comment-avatar" src="${c.avatar || '/icons/icon-192.png'}" onerror="this.src='/icons/icon-192.png';" alt="${c.username}" />
            <div class="comment-body">
              <div class="comment-user-row">
                <span class="comment-user-name">${c.username}</span>
                <button class="comment-like-btn" data-cid="${c.id}" data-likes="${c.likes || 0}" type="button">♥ ${c.likes || 0}</button>
              </div>
              <p class="comment-text">${c.content}</p>
            </div>
          </div>
        `).join("");
        commentsFeed.querySelectorAll(".comment-like-btn").forEach(btn => {
          btn.onclick = async () => {
            const cid = btn.dataset.cid;
            const curLikes = parseInt(btn.dataset.likes, 10);
            await likeEpisodeComment(cid, curLikes);
            btn.textContent = `♥ ${curLikes + 1}`;
          };
        });
      }
    }
  }

  if (commentBtn) {
    commentBtn.onclick = (e) => {
      e.stopPropagation();
      syncCommentsForCurrentEpisode();
      if (commentsBackdrop) commentsBackdrop.style.display = "flex";
    };
  }

  if (closeCommentsBtn) closeCommentsBtn.onclick = () => { if (commentsBackdrop) commentsBackdrop.style.display = "none"; };
  if (commentsBackdrop) commentsBackdrop.onclick = (e) => { if (e.target === commentsBackdrop) commentsBackdrop.style.display = "none"; };

  if (sendCommentBtn && commentInput) {
    sendCommentBtn.onclick = async () => {
      const text = commentInput.value.trim();
      if (!text || !currentSeries) return;
      const ep = currentEpisodes[currentEpisodeIndex];
      const curUser = getCurrentUser();
      sendCommentBtn.disabled = true;
      await postEpisodeComment({ seriesId: currentSeries.id, episodeId: ep.id, content: text, user: curUser });
      commentInput.value = "";
      sendCommentBtn.disabled = false;
      syncCommentsForCurrentEpisode();
    };
  }
"""

if "syncCommentsForCurrentEpisode" not in p:
    p = p.replace("loadEpisode(startIdx);", f"{comments_fn}\n  syncCommentsForCurrentEpisode();\n  loadEpisode(startIdx);")
    p = p.replace("if (epTitle) epTitle.textContent = ep.title;", "if (epTitle) epTitle.textContent = ep.title;\n    syncCommentsForCurrentEpisode();")

with open("public/js/player.js", "w", encoding="utf-8") as f:
    f.write(p)
print("  ✓ Step 4 Complete: public/js/player.js wired to live comments stream")
