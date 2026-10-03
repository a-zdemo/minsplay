comments_css = """
/* Comments Bottom Sheet Drawer */
.comments-sheet-box {
  background: #14141e !important;
  border-top: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 20px 20px 0 0 !important;
  width: 100% !important;
  max-width: 480px !important;
  height: 60vh !important;
  max-height: 520px !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}
.comments-feed-list {
  flex: 1 !important;
  overflow-y: auto !important;
  padding: 12px 16px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 14px !important;
}
.comment-item {
  display: flex !important;
  align-items: flex-start !important;
  gap: 10px !important;
}
.comment-avatar {
  width: 34px !important;
  height: 34px !important;
  border-radius: 50% !important;
  object-fit: cover !important;
  background: #252533 !important;
  flex-shrink: 0 !important;
}
.comment-body {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 2px !important;
}
.comment-user-row {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
}
.comment-user-name {
  font-size: 0.82rem !important;
  font-weight: 700 !important;
  color: rgba(255, 255, 255, 0.85) !important;
}
.comment-like-btn {
  all: unset !important;
  font-size: 0.74rem !important;
  color: rgba(255, 255, 255, 0.5) !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
}
.comment-text {
  margin: 0 !important;
  font-size: 0.82rem !important;
  color: rgba(255, 255, 255, 0.72) !important;
  line-height: 1.35 !important;
  word-break: break-word !important;
}
.comments-input-bar {
  padding: 10px 14px 20px !important;
  display: flex !important;
  gap: 8px !important;
  border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
  background: #111119 !important;
}
.comments-input-field {
  all: unset !important;
  flex: 1 !important;
  background: #1d1d2b !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 20px !important;
  padding: 8px 14px !important;
  font-size: 0.82rem !important;
  color: #fff !important;
}
.comments-send-btn {
  all: unset !important;
  background: #ff2e63 !important;
  color: #fff !important;
  font-weight: 800 !important;
  font-size: 0.78rem !important;
  padding: 0 16px !important;
  border-radius: 18px !important;
  cursor: pointer !important;
}
"""

with open("public/css/pages.css", "a", encoding="utf-8") as f:
    f.write(comments_css)
print("  ✓ Step 2 Complete: Comments drawer styling added to public/css/pages.css")
