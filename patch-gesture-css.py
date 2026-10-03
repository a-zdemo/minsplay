css = """
/* Touch Gesture Surface for Mobile Swipe Navigation */
.video-gesture-surface {
  position: absolute !important;
  inset: 0 !important;
  z-index: 5 !important;
  touch-action: none !important;
  -webkit-tap-highlight-color: transparent !important;
  cursor: pointer !important;
}
"""
with open("public/css/pages.css", "a", encoding="utf-8") as f:
    f.write(css)
print("  ✓ Step 2: Added .video-gesture-surface styling to pages.css")
