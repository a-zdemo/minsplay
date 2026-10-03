with open("public/js/player.js", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Replace video.play() in loadEpisode with resilient autoplay fallback
old_play = """    video.play().then(() => {
      showStatus("");
      if (playIndicator) playIndicator.classList.remove("active");
      showHUD();
    }).catch(() => {
      showStatus("");
      if (playIndicator) playIndicator.classList.add("active");
      showHUD();
    });"""

new_play = """    video.play().then(() => {
      showStatus("");
      if (playIndicator) playIndicator.classList.remove("active");
      showHUD();
    }).catch(() => {
      video.muted = true;
      video.play().then(() => {
        showStatus("");
        if (playIndicator) playIndicator.classList.remove("active");
        if (soundBtn) soundBtn.textContent = "🔇";
        showAppToast("Playing (Muted). Tap 🔊 to unmute");
        showHUD();
      }).catch(() => {
        showStatus("");
        if (playIndicator) playIndicator.classList.add("active");
        showHUD();
      });
    });"""

if old_play in code:
    code = code.replace(old_play, new_play)

# 2. Continuous next/prev episode & series transitions
nav_helpers = """  function goToNextEpisode() {
    if (currentEpisodeIndex < currentEpisodes.length - 1) {
      showAppToast(`▶ Next: Episode ${currentEpisodes[currentEpisodeIndex + 1].id}`);
      loadEpisode(currentEpisodeIndex + 1);
    } else {
      const cat = getSeriesById() ? (window.DRAMA_CATALOG || []) : [];
      showAppToast("🎬 Series Completed! Great binge.");
    }
  }

  function goToPrevEpisode() {
    if (currentEpisodeIndex > 0) {
      showAppToast(`◀ Previous: Episode ${currentEpisodes[currentEpisodeIndex - 1].id}`);
      loadEpisode(currentEpisodeIndex - 1);
    } else {
      showAppToast("⏮ You are at Episode 1");
    }
  }

  video.onended = () => { goToNextEpisode(); };"""

start_ended = code.find("  // Auto-advance")
end_ended = code.find("  // Touch Swipe Gestures", start_ended)
if start_ended != -1 and end_ended != -1:
    code = code[:start_ended] + nav_helpers + "\n\n" + code[end_ended:]

# 3. Touch Swipe Engine with touchmove event handling
new_gesture_code = """  // Touch Swipe Gestures
  let touchStartY = 0, touchStartX = 0, isTouching = false;
  const gestureSurface = document.getElementById("video-gesture-surface") || playerRoot || document;

  gestureSurface.ontouchstart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    isTouching = true;
  };

  gestureSurface.ontouchmove = (e) => {
    if (!isTouching || !e.touches || e.touches.length === 0) return;
    const dy = Math.abs(e.touches[0].clientY - touchStartY);
    if (dy > 8) e.preventDefault();
  };

  gestureSurface.ontouchend = (e) => {
    if (!isTouching) return;
    isTouching = false;
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const diffY = touchStartY - e.changedTouches[0].clientY;
    const diffX = touchStartX - e.changedTouches[0].clientX;

    if (e.target.closest("button, input, select, .drawer-sheet-box, .auth-sheet, .lock-modal-dialog, .rewarded-ad-modal")) return;

    if (Math.abs(diffY) > 40 && Math.abs(diffY) > Math.abs(diffX) * 1.1) {
      if (diffY > 0) goToNextEpisode();
      else goToPrevEpisode();
      return;
    }

    if (Math.abs(diffY) < 15 && Math.abs(diffX) < 15) {
      if (video.paused) {
        video.play().then(() => playIndicator?.classList.remove("active")).catch(() => {});
      } else {
        video.pause();
        playIndicator?.classList.add("active");
      }
      showHUD();
    }
  };"""

start_gest = code.find("  // Touch Swipe Gestures")
end_gest = code.find("  video.onloadedmetadata", start_gest)
if start_gest != -1 and end_gest != -1:
    code = code[:start_gest] + new_gesture_code + "\n\n" + code[end_gest:]

with open("public/js/player.js", "w", encoding="utf-8") as f:
    f.write(code)
print("  ✓ Step 4: player.js updated with swipe navigation and autoplay fallbacks")
