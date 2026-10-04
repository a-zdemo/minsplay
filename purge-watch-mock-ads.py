# 1. Update watch.html: Remove fake ad modal and update unlock button label
with open("public/pages/watch.html", "r", encoding="utf-8") as f:
    w = f.read()

# Update unlock button text
w = w.replace("🎁 Watch 5s Ad to Unlock Free", "🎬 Watch Ad to Unlock Free")
w = w.replace('id="btn-unlock-mock"', 'id="btn-unlock-admob"')

# Purge mock ad aside markup
start_aside = w.find('<!-- Rewarded Ad Modal -->')
if start_aside != -1:
    end_aside = w.find('</aside>', start_aside)
    if end_aside != -1:
        w = w[:start_aside] + w[end_aside + 8:]

with open("public/pages/watch.html", "w", encoding="utf-8") as f:
    f.write(w)
print("  ✓ public/pages/watch.html: Mock ad markup purged")

# 2. Update player.js: Purge mock intervals and wire AdMob Engine
with open("public/js/player.js", "r", encoding="utf-8") as f:
    p = f.read()

# Add import
if "admob-manager.js" not in p:
    p = 'import { showRewardedVideo, checkAndShowTransitionInterstitial } from "./admob-manager.js";\n' + p

# Remove unused interval declarations
p = p.replace("let adTimerInterval = null;\nlet adProgressInterval = null;", "// Ad intervals purged in favor of AdMob Engine")

# Replace mock button binding and startRewardedAdFlow
old_mock_block_start = p.find("  // LOCK MODAL FIX: 2. Unlock by watching 5s rewarded ad")
old_mock_block_end = p.find("  // LOCK MODAL FIX: 3. Choose another episode from drawer")

clean_admob_unlock = """  // REWARDED AD: Unlock via AdMob
  const unlockAdBtn = document.getElementById("btn-unlock-admob") || document.getElementById("btn-unlock-mock");
  if (unlockAdBtn) {
    unlockAdBtn.onclick = () => {
      const ep = currentEpisodes[currentEpisodeIndex];
      if (!ep || !currentSeries) return;

      showRewardedVideo({
        placement: "episode_unlock",
        onReward: () => {
          unlockEpisode(currentSeries.id, ep.id);
          showAppToast(`🎉 Episode ${ep.id} Unlocked via Ad!`);
          if (lockModal) lockModal.style.display = "none";
          loadEpisode(currentEpisodeIndex);
        },
        onDismiss: () => {
          showAppToast("Watch the full ad to unlock the episode.");
        }
      });
    };
  }
"""

if old_mock_block_start != -1 and old_mock_block_end != -1:
    p = p[:old_mock_block_start] + clean_admob_unlock + "\n" + p[old_mock_block_end:]

# Wire transition interstitial on next episode
if "checkAndShowTransitionInterstitial()" not in p:
    p = p.replace('loadEpisode(currentEpisodeIndex + 1);',
                  'checkAndShowTransitionInterstitial();\n      loadEpisode(currentEpisodeIndex + 1);')

with open("public/js/player.js", "w", encoding="utf-8") as f:
    f.write(p)
print("  ✓ public/js/player.js: Mock intervals purged & AdMob lifecycle handlers wired")
