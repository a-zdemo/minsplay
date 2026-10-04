shelves_css = """
/* Role-Based Dashboard Shelves on Profile Screen */
.db-staff-shelf {
  background: linear-gradient(135deg, rgba(0, 210, 252, 0.12) 0%, rgba(20, 20, 28, 0.95) 100%) !important;
  border: 1px solid rgba(0, 210, 252, 0.35) !important;
}
.db-creator-shelf {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.12) 0%, rgba(20, 20, 28, 0.95) 100%) !important;
  border: 1px solid rgba(255, 193, 7, 0.35) !important;
}
.db-row-left-cluster {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
}
.db-role-bubble {
  width: 38px !important;
  height: 38px !important;
  border-radius: 10px !important;
  display: grid !important;
  place-items: center !important;
  font-size: 1.3rem !important;
  flex-shrink: 0 !important;
}
.db-role-bubble.admin { background: rgba(0, 210, 252, 0.18) !important; }
.db-role-bubble.creator { background: rgba(255, 193, 7, 0.18) !important; }
.db-row-subtitle {
  display: block !important;
  font-size: 0.72rem !important;
  color: rgba(255, 255, 255, 0.55) !important;
  margin-top: 2px !important;
}
"""

with open("public/css/pages.css", "a", encoding="utf-8") as f:
    f.write(shelves_css)
print("  ✓ Step 5 Complete: Shelf styling added to pages.css")
