css = """
/* Clean User Card Layout & Single-Line Tags */
.admin-user-role-card {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 12px !important;
  padding: 12px 14px !important;
  background: #14141e !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 12px !important;
  margin-bottom: 10px !important;
}
.admin-user-meta {
  display: flex !important;
  flex-direction: column !important;
  gap: 3px !important;
  flex: 1 !important;
  min-width: 0 !important;
}
.admin-user-name-line {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}
.admin-user-name {
  font-size: 0.94rem !important;
  font-weight: 800 !important;
  color: #ffffff !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
.admin-role-pill {
  font-size: 0.62rem !important;
  font-weight: 800 !important;
  padding: 2px 7px !important;
  border-radius: 6px !important;
  letter-spacing: 0.3px !important;
  flex-shrink: 0 !important;
}
.admin-role-pill.user {
  background: rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.8) !important;
}
.admin-role-pill.admin {
  background: rgba(0, 210, 252, 0.18) !important;
  color: #00d2fc !important;
  border: 1px solid rgba(0, 210, 252, 0.35) !important;
}
.admin-role-pill.super_admin {
  background: rgba(255, 193, 7, 0.18) !important;
  color: #ffc107 !important;
  border: 1px solid rgba(255, 193, 7, 0.35) !important;
}
.admin-user-email {
  font-size: 0.74rem !important;
  color: rgba(255, 255, 255, 0.55) !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
.admin-user-id-sub {
  font-size: 0.68rem !important;
  color: rgba(255, 255, 255, 0.38) !important;
  font-family: monospace !important;
}
.admin-user-action-wrap {
  flex-shrink: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  white-space: nowrap !important;
}
.super-locked-tag {
  all: unset !important;
  box-sizing: border-box !important;
  font-size: 0.72rem !important;
  font-weight: 800 !important;
  color: #ffc107 !important;
  background: rgba(255, 193, 7, 0.15) !important;
  border: 1px solid rgba(255, 193, 7, 0.35) !important;
  padding: 6px 12px !important;
  border-radius: 8px !important;
  white-space: nowrap !important;
  text-align: center !important;
  display: inline-block !important;
}
.btn-user-promote {
  all: unset !important;
  box-sizing: border-box !important;
  font-size: 0.74rem !important;
  font-weight: 800 !important;
  padding: 7px 12px !important;
  border-radius: 8px !important;
  cursor: pointer !important;
  white-space: nowrap !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}
"""

with open("public/css/pages.css", "a", encoding="utf-8") as f:
    f.write(css)
print("  ✓ Step 2 Complete: Non-wrapping card CSS applied")
