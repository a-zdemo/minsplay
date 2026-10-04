css = """
/* AdMob Super Admin Console */
.admob-console-card {
  background: #14141e;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.admob-status-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.admob-section-title { font-size: 0.94rem; color: #ffffff; display: block; }
.admob-section-desc { margin: 2px 0 0; font-size: 0.72rem; color: rgba(255, 255, 255, 0.5); }
.admob-card-head { margin: 0 0 2px; font-size: 0.88rem; font-weight: 800; color: #ffc107; text-transform: uppercase; letter-spacing: 0.3px; }
.admob-form-group { display: flex; flex-direction: column; gap: 4px; }
.admob-label { font-size: 0.72rem; font-weight: 700; color: rgba(255, 255, 255, 0.65); }
.admob-input {
  all: unset;
  box-sizing: border-box;
  background: #1c1c28;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.78rem;
  font-family: monospace;
  color: #00d2fc;
}
.admob-input:focus { border-color: #00d2fc; }
.admob-row-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.admob-save-bar { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; margin-bottom: 30px; }
.btn-admob-primary {
  all: unset;
  background: linear-gradient(90deg, #00d2fc, #0077ff);
  color: #ffffff;
  font-weight: 800;
  font-size: 0.82rem;
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
}
.btn-admob-secondary {
  all: unset;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
  font-weight: 700;
  font-size: 0.78rem;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
}

/* AdMob Test Mode Overlay */
.admob-runtime-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}
.admob-dialog-box {
  background: #14141e;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  width: 100%;
  max-width: 380px;
  padding: 18px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9);
}
.admob-dialog-header { display: flex; justify-content: space-between; align-items: center; }
.admob-google-badge { font-size: 0.65rem; font-weight: 900; color: #ffc107; background: rgba(255, 193, 7, 0.15); padding: 3px 8px; border-radius: 6px; letter-spacing: 0.5px; }
.admob-close-icon { all: unset; color: rgba(255, 255, 255, 0.5); font-size: 1.1rem; cursor: pointer; }
.admob-dialog-body { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.admob-icon-cluster { font-size: 2.2rem; }
.admob-dialog-title { margin: 0; font-size: 1.1rem; font-weight: 800; color: #ffffff; }
.admob-unit-label { margin: 4px 0 0; font-size: 0.68rem; color: rgba(255, 255, 255, 0.5); }
.admob-unit-code { font-size: 0.72rem; color: #00d2fc; background: rgba(0, 210, 252, 0.1); padding: 3px 8px; border-radius: 6px; word-break: break-all; }
.admob-countdown-bar { width: 100%; height: 4px; background: rgba(255, 255, 255, 0.1); border-radius: 2px; overflow: hidden; margin-top: 8px; }
.admob-countdown-fill { width: 100%; height: 100%; background: #00d2fc; }
.btn-admob-grant {
  all: unset;
  box-sizing: border-box;
  width: 100%;
  text-align: center;
  background: linear-gradient(90deg, #ff1765, #ff5e3a);
  color: #ffffff;
  font-weight: 800;
  font-size: 0.88rem;
  padding: 12px 0;
  border-radius: 20px;
  cursor: pointer;
}
"""

with open("public/css/pages.css", "a", encoding="utf-8") as f:
    f.write(css)
print("  ✓ public/css/pages.css updated with AdMob console styling")
