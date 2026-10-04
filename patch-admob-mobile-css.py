css_override = """
/* Mobile Responsive Fixes for AdMob Console */
#pane-ads .pane-action-bar {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 10px !important;
  margin-bottom: 12px !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

#pane-ads .pane-subtitle {
  font-size: 0.74rem !important;
  font-weight: 700 !important;
  color: rgba(255, 255, 255, 0.65) !important;
  line-height: 1.3 !important;
  flex: 1 !important;
  min-width: 0 !important;
}

#btn-admob-test-trigger {
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  font-size: 0.72rem !important;
  padding: 6px 12px !important;
  line-height: 1.2 !important;
}

.admob-console-card {
  box-sizing: border-box !important;
  width: 100% !important;
  max-width: 100% !important;
  overflow: hidden !important;
}

.admob-row-2col {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 10px !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

.admob-form-group {
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
  min-width: 0 !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

.admob-label {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  font-size: 0.7rem !important;
}

.admob-input {
  all: unset !important;
  box-sizing: border-box !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  background: #1c1c28 !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
  padding: 9px 10px !important;
  font-size: 0.74rem !important;
  font-family: monospace !important;
  color: #00d2fc !important;
  text-align: left !important;
}

.admob-input:focus {
  border-color: #00d2fc !important;
  background: #222232 !important;
}
"""

with open("public/css/pages.css", "a", encoding="utf-8") as f:
    f.write("\n" + css_override)

print("✓ Successfully patched mobile AdMob styling in public/css/pages.css")
