css = """
/* Admin Live Users Search, Filter & Pagination Styling */
.users-found-pill {
  font-size: 0.7rem !important;
  font-weight: 800 !important;
  color: #00d2fc !important;
  background: rgba(0, 210, 252, 0.12) !important;
  padding: 3px 8px !important;
  border-radius: 8px !important;
}
.admin-users-filter-bar {
  display: flex !important;
  gap: 8px !important;
  align-items: center !important;
  margin-bottom: 12px !important;
  width: 100% !important;
  box-sizing: border-box !important;
}
.users-search-box { flex: 1 !important; }
.users-search-input {
  all: unset !important;
  box-sizing: border-box !important;
  width: 100% !important;
  background: #161622 !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 10px !important;
  padding: 9px 12px !important;
  font-size: 0.8rem !important;
  color: #ffffff !important;
}
.users-search-input:focus { border-color: #00d2fc !important; }
.users-pagesize-select {
  all: unset !important;
  box-sizing: border-box !important;
  background: #161622 !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.8) !important;
  font-size: 0.74rem !important;
  font-weight: 700 !important;
  padding: 9px 10px !important;
  border-radius: 10px !important;
  cursor: pointer !important;
}
.admin-user-id-sub {
  font-size: 0.68rem !important;
  color: rgba(255, 255, 255, 0.4) !important;
  font-family: monospace !important;
}
.users-pagination-bar {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 12px 4px 6px !important;
  border-top: 1px solid rgba(255, 255, 255, 0.06) !important;
  margin-top: 6px !important;
}
.btn-users-page {
  all: unset !important;
  box-sizing: border-box !important;
  padding: 7px 14px !important;
  background: #14141e !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 8px !important;
  font-size: 0.74rem !important;
  font-weight: 800 !important;
  color: #ffffff !important;
  cursor: pointer !important;
}
.btn-users-page:disabled {
  opacity: 0.35 !important;
  cursor: not-allowed !important;
}
.users-page-indicator {
  font-size: 0.74rem !important;
  font-weight: 700 !important;
  color: rgba(255, 255, 255, 0.6) !important;
}
"""

with open("public/css/pages.css", "a", encoding="utf-8") as f:
    f.write(css)
print("  ✓ Step 4 Complete: Search & pagination styling added to public/css/pages.css")
