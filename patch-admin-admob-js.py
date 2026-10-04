with open("public/js/admin.js", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add imports
imp_line = 'import { fetchAdmobConfig, getAdmobConfig, saveAdmobConfig, showRewardedVideo } from "./admob-manager.js";\n'
if "admob-manager.js" not in code:
    code = imp_line + code

# 2. Show tab in initAdminDashboard for Super Admin
tab_show = """  const adsTab = document.getElementById("tab-admin-ads");
  if (adsTab) adsTab.style.display = isSuper ? "inline-flex" : "none";
  if (isSuper) initAdmobSettingsPanel();"""

if "tab-admin-ads" not in code:
    code = code.replace('if (rolesTab) rolesTab.style.display = isSuper ? "inline-flex" : "none";',
                        'if (rolesTab) rolesTab.style.display = isSuper ? "inline-flex" : "none";\n' + tab_show)

# 3. Add pane switch handler
old_switch = 'if (paneId === "roles") fetchSupabaseUsers();'
new_switch = """if (paneId === "roles") fetchSupabaseUsers();
      if (paneId === "ads") loadAdmobFormValues();"""

if old_switch in code and "paneId === \"ads\"" not in code:
    code = code.replace(old_switch, new_switch)

# 4. Append AdMob console logic
admob_logic = """
function initAdmobSettingsPanel() {
  loadAdmobFormValues();

  const saveBtn = document.getElementById("btn-admob-save-config");
  if (saveBtn && !saveBtn.dataset.wired) {
    saveBtn.dataset.wired = "true";
    saveBtn.onclick = async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving to Cloud... ⏳";
      const payload = {
        enabled: document.getElementById("admob-toggle-enabled")?.checked ?? true,
        test_mode: document.getElementById("admob-toggle-testmode")?.checked ?? true,
        app_id: document.getElementById("admob-input-appid")?.value.trim() || "",
        rewarded_unlock_unit: document.getElementById("admob-input-rewarded-unlock")?.value.trim() || "",
        rewarded_unlock_coins: parseInt(document.getElementById("admob-input-unlock-coins")?.value || "30", 10),
        rewarded_task_coins: parseInt(document.getElementById("admob-input-task-coins")?.value || "20", 10),
        rewarded_task_unit: document.getElementById("admob-input-rewarded-task")?.value.trim() || "",
        rewarded_task_limit: parseInt(document.getElementById("admob-input-task-limit")?.value || "15", 10),
        interstitial_unit: document.getElementById("admob-input-interstitial")?.value.trim() || "",
        interstitial_frequency: parseInt(document.getElementById("admob-input-interstitial-freq")?.value || "3", 10),
        banner_unit: document.getElementById("admob-input-banner")?.value.trim() || ""
      };
      const ok = await saveAdmobConfig(payload);
      saveBtn.disabled = false;
      saveBtn.textContent = "Save AdMob Settings 💾";
      showAppToast(ok ? "AdMob configuration saved live to Supabase! ✓" : "Saved locally.");
    };
  }

  const resetBtn = document.getElementById("btn-admob-reset-defaults");
  if (resetBtn && !resetBtn.dataset.wired) {
    resetBtn.dataset.wired = "true";
    resetBtn.onclick = async () => {
      if (confirm("Reset all ad units to official Google test units?")) {
        await saveAdmobConfig({
          test_mode: true,
          enabled: true,
          app_id: "ca-app-pub-3940256099942544~3347511713",
          rewarded_unlock_unit: "ca-app-pub-3940256099942544/5224354917",
          rewarded_task_unit: "ca-app-pub-3940256099942544/5224354917",
          interstitial_unit: "ca-app-pub-3940256099942544/1033173712",
          banner_unit: "ca-app-pub-3940256099942544/6300978111"
        });
        loadAdmobFormValues();
        showAppToast("Restored Google AdMob test defaults ✓");
      }
    };
  }

  const testTriggerBtn = document.getElementById("btn-admob-test-trigger");
  if (testTriggerBtn && !testTriggerBtn.dataset.wired) {
    testTriggerBtn.dataset.wired = "true";
    testTriggerBtn.onclick = () => {
      showRewardedVideo({
        placement: "admin_test",
        onReward: () => showAppToast("🎉 AdMob reward granted successfully!"),
        onDismiss: () => showAppToast("Ad closed.")
      });
    };
  }
}

async function loadAdmobFormValues() {
  const cfg = await fetchAdmobConfig();
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ""; };
  const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = Boolean(val); };

  setChk("admob-toggle-enabled", cfg.enabled);
  setChk("admob-toggle-testmode", cfg.test_mode);
  setVal("admob-input-appid", cfg.app_id);
  setVal("admob-input-rewarded-unlock", cfg.rewarded_unlock_unit);
  setVal("admob-input-unlock-coins", cfg.rewarded_unlock_coins);
  setVal("admob-input-task-coins", cfg.rewarded_task_coins);
  setVal("admob-input-rewarded-task", cfg.rewarded_task_unit);
  setVal("admob-input-task-limit", cfg.rewarded_task_limit);
  setVal("admob-input-interstitial", cfg.interstitial_unit);
  setVal("admob-input-interstitial-freq", cfg.interstitial_frequency);
  setVal("admob-input-banner", cfg.banner_unit);
}
"""

if "function initAdmobSettingsPanel()" not in code:
    code += "\n" + admob_logic

with open("public/js/admin.js", "w", encoding="utf-8") as f:
    f.write(code)
print("  ✓ public/js/admin.js updated with live AdMob configuration logic")
