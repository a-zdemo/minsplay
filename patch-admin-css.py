css_rules = """
/* Admin Mobile Horizontal Tabs & Promotion Bar */
.admin-nav-tabs {
  display: flex !important;
  gap: 8px !important;
  overflow-x: auto !important;
  white-space: nowrap !important;
  scrollbar-width: none !important;
  -webkit-overflow-scrolling: touch !important;
  padding-bottom: 6px !important;
}
.admin-nav-tabs::-webkit-scrollbar { display: none; }
.admin-tab-btn {
  all: unset !important;
  box-sizing: border-box !important;
  flex-shrink: 0 !important;
  padding: 7px 14px !important;
  background: #14141e !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 16px !important;
  font-size: 0.74rem !important;
  font-weight: 700 !important;
  color: rgba(255, 255, 255, 0.6) !important;
  white-space: nowrap !important;
  cursor: pointer !important;
}
.admin-tab-btn.active {
  background: rgba(0, 210, 252, 0.15) !important;
  border-color: #00d2fc !important;
  color: #00d2fc !important;
}
.admin-pane { width: 100% !important; flex-direction: column !important; }
.admin-promote-bar { display: flex !important; gap: 8px !important; margin-bottom: 12px !important; width: 100% !important; box-sizing: border-box !important; }
.admin-promote-input { all: unset !important; box-sizing: border-box !important; flex: 1 !important; background: #1a1a26 !important; border: 1px solid rgba(255, 255, 255, 0.12) !important; border-radius: 10px !important; padding: 10px 14px !important; font-size: 0.82rem !important; color: #fff !important; }
.btn-promote-submit { all: unset !important; box-sizing: border-box !important; background: linear-gradient(135deg, #00d2fc, #0077ff) !important; color: #fff !important; font-weight: 800 !important; font-size: 0.82rem !important; padding: 0 16px !important; border-radius: 10px !important; cursor: pointer !important; white-space: nowrap !important; display: flex !important; align-items: center !important; justify-content: center !important; }
"""

with open("public/css/pages.css", "a", encoding="utf-8") as f:
    f.write(css_rules)
print("  ✓ Step 2 Complete: Tab mobile scrolling and promotion styling added")
