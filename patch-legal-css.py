css = """
/* Legal & Compliance Pages (Privacy Policy & Data Deletion) */
.db-legal-screen { background: #000000 !important; }
.legal-content-card {
  background: #14141c;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px 14px 28px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.legal-effective-date {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.45);
  margin: 0 0 4px;
}
.legal-heading {
  margin: 12px 0 2px;
  font-size: 0.95rem;
  font-weight: 800;
  color: #ffffff;
}
.legal-text {
  margin: 0;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}
.legal-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.76rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.4;
}
.btn-request-purge {
  all: unset;
  box-sizing: border-box;
  width: 100%;
  text-align: center;
  background: rgba(255, 46, 99, 0.18);
  border: 1px solid rgba(255, 46, 99, 0.4);
  color: #ff2e63;
  font-weight: 800;
  font-size: 0.86rem;
  padding: 12px 0;
  border-radius: 14px;
  cursor: pointer;
  margin-top: 6px;
}
.btn-request-purge:active { background: #ff2e63; color: #fff; }

/* Profile Legal Footer Links */
.db-profile-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 0 24px;
}
.db-legal-links-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.db-legal-btn {
  font-size: 0.74rem;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: color 0.15s ease;
}
.db-legal-btn:active { color: #ff2e63; }
.db-legal-dot {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.25);
}
"""

with open("public/css/pages.css", "a", encoding="utf-8") as f:
    f.write(css)
print("  ✓ Legal page & footer link styling appended to public/css/pages.css")
