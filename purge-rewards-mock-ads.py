with open("public/js/rewards.js", "r", encoding="utf-8") as f:
    r = f.read()

# Add import
if "admob-manager.js" not in r:
    r = 'import { showRewardedVideo } from "./admob-manager.js";\n' + r

# Replace triggerRewardedAd mock with AdMob Engine
old_ad_fn_start = r.find("function triggerRewardedAd(")
if old_ad_fn_start != -1:
    old_ad_fn_end = r.find("export function initRewardsPage()", old_ad_fn_start)
    new_ad_fn = """function triggerRewardedAd(rewardCoins, taskName, onComplete) {
  showRewardedVideo({
    placement: "rewards_loop",
    onReward: () => {
      addCoins(rewardCoins);
      showAppToast(`🎁 Reward granted! +${rewardCoins} Coins added.`);
      if (typeof onComplete === "function") onComplete();
    },
    onDismiss: () => {
      showAppToast("Watch the full ad to earn coins.");
    }
  });
}

"""
    r = r[:old_ad_fn_start] + new_ad_fn + r[old_ad_fn_end:]

with open("public/js/rewards.js", "w", encoding="utf-8") as f:
    f.write(r)
print("  ✓ public/js/rewards.js: Mock setTimeout ad purged & wired to AdMob Engine")
