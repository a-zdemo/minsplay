with open("public/pages/watch.html", "r", encoding="utf-8") as f:
    h = f.read()

old_stage = '<div class="video-stage" id="video-stage">\n    <video'
new_stage = '<div class="video-stage" id="video-stage">\n    <div class="video-gesture-surface" id="video-gesture-surface"></div>\n    <video'

if "video-gesture-surface" not in h and old_stage in h:
    h = h.replace(old_stage, new_stage)
    with open("public/pages/watch.html", "w", encoding="utf-8") as f:
        f.write(h)
    print("  ✓ Step 1: Added video-gesture-surface to watch.html")
else:
    print("  ✓ Step 1: Already up to date")
