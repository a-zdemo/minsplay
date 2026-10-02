css = '''
/* ==========================================================================
   Authentic DramaBox Auth Page Styles
   ========================================================================== */
.db-auth-page {
  background: #000000 !important;
  min-height: 100vh !important;
  height: 100dvh !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
}

.db-auth-container {
  width: 100%;
  max-width: 440px;
  height: 100%;
  padding: 16px 24px 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
}

.db-auth-nav {
  display: flex;
  align-items: center;
  height: 48px;
}

.db-auth-brand-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: -30px;
}

.db-auth-logo-box {
  width: 90px;
  height: 90px;
  border-radius: 24px;
  background: linear-gradient(135deg, #ff1765 0%, #ff5722 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 28px rgba(255, 23, 101, 0.45);
}

.db-auth-play-symbol {
  font-size: 2.5rem;
  color: #ffffff;
  margin-left: 6px;
}

.db-auth-title {
  margin: 0;
  font-size: 1.85rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.5px;
}

.db-auth-buttons-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
}

.db-social-btn-wrap {
  position: relative;
  width: 100%;
}

.db-social-pref-badge {
  position: absolute;
  top: -10px;
  right: 18px;
  background: #9c7bf4;
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 2px 10px;
  border-radius: 10px;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.btn-db-social {
  all: unset;
  box-sizing: border-box;
  width: 100%;
  height: 52px;
  border-radius: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
}
.btn-db-social:active { transform: scale(0.98); }

.btn-db-social.facebook {
  background: #5b86e5;
  color: #ffffff;
}
.fb-icon {
  font-family: sans-serif;
  font-weight: 900;
  font-size: 1.4rem;
  line-height: 1;
}

.btn-db-social.google {
  background: #ffffff;
  color: #202124;
}

.db-auth-terms-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.db-auth-terms-text {
  margin: 0;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.4;
}

.db-legal-link {
  color: rgba(255, 255, 255, 0.75);
  text-decoration: underline;
}

/* Staff & Testing Role Switcher */
.btn-staff-expand {
  all: unset;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  padding: 4px 8px;
}
.db-staff-roles-panel {
  width: 100%;
  margin-top: 8px;
  background: #14141e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 10px;
}
.db-rbac-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.btn-rbac-pill {
  all: unset;
  text-align: center;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 7px 4px;
  border-radius: 8px;
  cursor: pointer;
}
.btn-rbac-pill:active { background: #ff1765; }
'''
with open("public/css/pages.css", "a", encoding="utf-8") as f:
    f.write(css)
print("Appended DramaBox Auth styles to pages.css ✓")
