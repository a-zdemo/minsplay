css = '''
/* ==========================================================================
   Complete DramaBox Join Membership Styling (No Footer Clashing)
   ========================================================================== */
.db-member-screen {
  background: #000000 !important;
  min-height: 100vh !important;
  color: #ffffff !important;
  box-sizing: border-box !important;
}

.db-member-scroll-body {
  padding: 12px 16px 140px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 20px !important;
  max-width: 520px;
  margin: 0 auto;
}

.db-member-top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}
.db-member-nav-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #ffffff;
}

/* Members-Only Drama Showcase Scroller */
.db-member-showcase-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.db-member-posters-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 6px;
  scrollbar-width: none;
}
.db-member-posters-scroll::-webkit-scrollbar { display: none; }
.member-drama-poster-card {
  width: 110px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
}
.member-poster-thumb {
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);
}
.member-poster-title {
  font-size: 0.74rem;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Coming Soon Section */
.db-coming-soon-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.coming-soon-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.coming-soon-date {
  font-size: 0.82rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  gap: 4px;
}
.cs-dot { color: #ff1765; font-size: 0.65rem; }
.coming-soon-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.cs-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cs-thumb {
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: flex-end;
  padding: 6px;
  box-sizing: border-box;
}
.cs-badge {
  font-size: 0.52rem;
  font-weight: 800;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.65);
  padding: 2px 4px;
  border-radius: 4px;
}
.btn-remind-me {
  all: unset;
  box-sizing: border-box;
  width: 100%;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 800;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 6px 0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-remind-me.active {
  background: rgba(39, 201, 63, 0.2);
  border-color: #27c93f;
  color: #27c93f;
}

/* Tips Section */
.db-member-tips-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.tips-heading {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.65);
}
.tips-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.45;
}
.tips-link-text {
  margin: 4px 0 0;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.4;
}
.tips-gp-link {
  color: #a8c7fa;
  text-decoration: underline;
}

/* Clean Full-Bleed Sticky Footer */
.db-member-footer-bar {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  background: rgba(10, 10, 14, 0.98) !important;
  backdrop-filter: blur(14px) !important;
  -webkit-backdrop-filter: blur(14px) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
  padding: 12px 18px 24px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 6px !important;
  z-index: 100 !important;
}
.btn-db-join-now {
  all: unset !important;
  box-sizing: border-box !important;
  width: 100% !important;
  text-align: center !important;
  background: #ff1765 !important;
  color: #ffffff !important;
  font-size: 1.05rem !important;
  font-weight: 900 !important;
  padding: 14px 0 !important;
  border-radius: 28px !important;
  cursor: pointer !important;
  box-shadow: 0 4px 18px rgba(255, 23, 101, 0.5) !important;
}
.btn-db-join-now:active { transform: scale(0.98); }
.db-footer-terms {
  font-size: 0.72rem !important;
  color: rgba(255, 255, 255, 0.45) !important;
}
'''
with open("public/css/pages.css", "a", encoding="utf-8") as f:
    f.write(css)
print("Appended complete DramaBox member styles to pages.css ✓")
