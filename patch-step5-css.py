css = '''
/* ==========================================================================
   DramaBox Unauthenticated User Experience (Screens 1, 2, 3)
   ========================================================================== */
.guest-silhouette { background: #3a3b45 !important; }
.db-login-title-row { display: flex; align-items: center; gap: 4px; cursor: pointer; }
.db-login-arrow { font-size: 1.25rem; color: #ffffff; line-height: 1; }
.db-vip-discount-tag-pink {
  position: absolute;
  top: 0;
  right: 0;
  background: #7c4dff;
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 900;
  padding: 3px 8px;
  border-bottom-left-radius: 10px;
}
.db-vip-action-btn-white {
  all: unset;
  background: #ffffff;
  color: #ff2e63;
  font-weight: 900;
  font-size: 0.85rem;
  padding: 8px 22px;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
}

/* Screen 2: Member Page */
.db-member-screen { background: #000; min-height: 100vh; color: #fff; }
.db-member-scroll-body { padding: 12px 16px 100px; display: flex; flex-direction: column; gap: 16px; }
.db-member-hero-art {
  height: 120px;
  display: flex;
  align-items: flex-end;
  padding-bottom: 10px;
  background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, #000 100%);
}
.db-member-title { margin: 0; font-size: 1.5rem; font-weight: 900; color: #fff; }

.db-membership-plans { display: flex; flex-direction: column; gap: 12px; }
.db-membership-plan-card {
  position: relative;
  background: #15151c;
  border: 1.5px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 16px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.db-membership-plan-card.selected {
  background: linear-gradient(135deg, rgba(255, 46, 99, 0.12), rgba(255, 23, 101, 0.05));
  border-color: #ff1765;
}
.db-plan-timer-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #9c27b0;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 3px 8px;
  border-bottom-left-radius: 10px;
}
.plan-card-body { display: flex; align-items: center; gap: 12px; }
.plan-radio-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid rgba(255,255,255,0.4);
  display: grid;
  place-items: center;
  font-size: 0.75rem;
  color: #fff;
  flex-shrink: 0;
}
.plan-radio-circle.checked { background: #ff1765; border-color: #ff1765; }
.plan-details { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.plan-tier-name { margin: 0; font-size: 0.95rem; font-weight: 800; color: #fff; }
.plan-price-row { display: flex; align-items: baseline; gap: 6px; }
.plan-sale-price { font-size: 1.25rem; font-weight: 900; color: #fff; }
.plan-orig-price { font-size: 0.85rem; color: rgba(255,255,255,0.4); text-decoration: line-through; }
.plan-terms-desc { margin: 0; font-size: 0.7rem; color: rgba(255,255,255,0.5); }
.plan-purple-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  color: #ba68c8;
  background: rgba(186, 104, 200, 0.15);
  border: 1px solid rgba(186, 104, 200, 0.4);
  padding: 2px 6px;
  border-radius: 6px;
  margin-top: 4px;
}

.db-why-join-section { display: flex; flex-direction: column; gap: 10px; margin-top: 6px; }
.why-join-heading { margin: 0; font-size: 1rem; font-weight: 800; color: #fff; }
.why-join-list { display: flex; flex-direction: column; gap: 10px; }
.why-join-item { display: flex; align-items: center; gap: 12px; }
.why-icon { font-size: 1.3rem; }
.why-text strong { font-size: 0.84rem; color: #fff; display: block; }
.why-text p { margin: 0; font-size: 0.72rem; color: rgba(255,255,255,0.5); }

.db-member-footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(10,10,14,0.96);
  backdrop-filter: blur(12px);
  padding: 12px 16px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  z-index: 40;
}
.btn-db-join-now {
  all: unset;
  box-sizing: border-box;
  width: 100%;
  text-align: center;
  background: #ff1765;
  color: #fff;
  font-size: 1.05rem;
  font-weight: 900;
  padding: 13px 0;
  border-radius: 25px;
  cursor: pointer;
}
.db-footer-terms { font-size: 0.72rem; color: rgba(255,255,255,0.4); }

/* Screen 3: Google Play Modal Bottom Sheet */
.google-play-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px);
  z-index: 250;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.google-play-sheet {
  background: #1e1e24;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  width: 100%;
  max-width: 480px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 -10px 40px rgba(0,0,0,0.9);
}
.gp-sheet-header { display: flex; justify-content: space-between; align-items: center; }
.gp-logo-title { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.05rem; color: #fff; }
.gp-play-icon { font-size: 0.9rem; color: #00e676; }
.gp-close-btn { all: unset; color: rgba(255,255,255,0.6); font-size: 1.1rem; cursor: pointer; }
.gp-product-row { display: flex; align-items: center; gap: 12px; }
.gp-app-icon { width: 44px; height: 44px; border-radius: 10px; }
.gp-product-name { margin: 0; font-size: 1rem; font-weight: 800; color: #fff; }
.gp-app-name { font-size: 0.76rem; color: rgba(255,255,255,0.6); }
.gp-pricing-box {
  background: #152232;
  border: 1px solid #1976d2;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.gp-price-line { display: flex; justify-content: space-between; font-size: 0.82rem; color: rgba(255,255,255,0.7); }
.gp-price-line.active strong { color: #fff; font-size: 0.95rem; }
.gp-tax-link { font-size: 0.72rem; color: rgba(255,255,255,0.5); }
.gp-bullet-points { margin: 0; padding-left: 14px; list-style: none; font-size: 0.74rem; color: rgba(255,255,255,0.7); display: flex; flex-direction: column; gap: 4px; }
.gp-payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255,255,255,0.06);
  padding: 10px 12px;
  border-radius: 10px;
}
.gp-card-left { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #fff; }
.gp-legal-copy { margin: 0; font-size: 0.68rem; color: rgba(255,255,255,0.45); line-height: 1.4; }
.btn-gp-subscribe {
  all: unset;
  box-sizing: border-box;
  width: 100%;
  text-align: center;
  background: #a8c7fa;
  color: #041e49;
  font-size: 0.95rem;
  font-weight: 900;
  padding: 12px 0;
  border-radius: 22px;
  cursor: pointer;
}
'''

with open("public/css/pages.css", "a", encoding="utf-8") as f:
    f.write(css)
print("Appended DramaBox member and profile styles to pages.css ✓")
