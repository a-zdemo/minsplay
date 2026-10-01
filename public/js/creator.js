import { showAppToast, navigateTo } from "./router.js";
import { savePublishedEpisode, DRAMA_CATALOG, saveCatalogToStorage } from "./series-data.js";

const ENDPOINT_URL = "https://lekmsvdbthupiauejffo.supabase.co/functions/v1/smart-responder";

let selectedFile = null;
let currentEditingSeriesId = null;
let currentEditingEpisodeId = null;

export function initCreatorStudio() {
  const fileInput = document.getElementById("upload-video-file");
  const seriesSelect = document.getElementById("upload-series-select");
  const newSeriesGroup = document.getElementById("group-new-series-title");
  const publishBtn = document.getElementById("btn-publish-episode");
  const refreshBtn = document.getElementById("btn-refresh-creator-data");

  const tabsBar = document.getElementById("creator-nav-tabs");
  if (tabsBar) {
    tabsBar.onclick = (e) => {
      const btn = e.target.closest(".creator-tab-btn");
      if (!btn) return;
      tabsBar.querySelectorAll(".creator-tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const paneId = btn.getAttribute("data-pane");
      document.querySelectorAll(".creator-pane").forEach((p) => {
        p.style.display = "none";
        p.classList.remove("active");
      });

      const activePane = document.getElementById(`pane-creator-${paneId}`);
      if (activePane) {
        activePane.style.display = "flex";
        activePane.classList.add("active");
        if (paneId === "manage") renderCreatorCMSFeed();
      }
    };
  }

  if (seriesSelect) {
    const options = DRAMA_CATALOG.map((d) => `<option value="${d.id}">${d.title}</option>`).join("");
    seriesSelect.innerHTML = options + `<option value="new-series">+ Create New Drama Series...</option>`;
    
    seriesSelect.onchange = () => {
      if (newSeriesGroup) {
        newSeriesGroup.style.display = seriesSelect.value === "new-series" ? "flex" : "none";
      }
    };
  }

  if (fileInput) {
    fileInput.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      selectedFile = file;

      const idle = document.getElementById("dropzone-idle-content");
      const selected = document.getElementById("dropzone-selected-content");
      const nameEl = document.getElementById("selected-file-name");
      const specsEl = document.getElementById("selected-file-specs");

      if (idle) idle.style.display = "none";
      if (selected) selected.style.display = "flex";
      if (nameEl) nameEl.textContent = file.name;
      if (specsEl) specsEl.textContent = `${(file.size / (1024 * 1024)).toFixed(1)}MB • Ready to upload`;
      showAppToast("Video selected ✓");
    };
  }

  if (publishBtn) publishBtn.onclick = handleEpisodePublish;

  if (refreshBtn) {
    refreshBtn.onclick = () => {
      renderCreatorCMSFeed();
      showAppToast("Creator data refreshed ✓");
    };
  }

  attachCMSEditModalEvents();
}

async function handleEpisodePublish() {
  if (!selectedFile) {
    showAppToast("Please select a video file first");
    return;
  }

  const seriesSelect = document.getElementById("upload-series-select");
  const titleInput = document.getElementById("upload-ep-title");
  const epNumInput = document.getElementById("upload-ep-num");
  const priceInput = document.getElementById("upload-ep-price");
  const newTitleInput = document.getElementById("upload-new-series-title");
  const publishBtn = document.getElementById("btn-publish-episode");

  let seriesId = seriesSelect ? seriesSelect.value : "new-series";
  let seriesTitle = "";

  if (seriesId === "new-series") {
    seriesTitle = newTitleInput ? newTitleInput.value.trim() : "";
    if (!seriesTitle) {
      showAppToast("Please enter a title for the new series");
      return;
    }
    seriesId = seriesTitle.toLowerCase().replace(/[^a-z0-9]/g, "-") || "creator-series";
  } else {
    const existing = DRAMA_CATALOG.find((d) => d.id === seriesId);
    seriesTitle = existing ? existing.title : "Series";
  }

  const epTitle = titleInput ? titleInput.value.trim() : "";
  const epNum = epNumInput ? parseInt(epNumInput.value, 10) : 1;
  const price = priceInput ? parseInt(priceInput.value, 10) : 0;

  if (!epTitle) {
    showAppToast("Please enter an episode subtitle");
    return;
  }

  publishBtn.disabled = true;
  publishBtn.textContent = "Authorizing R2 Upload...";

  const progressWrap = document.getElementById("upload-progress-wrap");
  const progressFill = document.getElementById("upload-progress-fill");
  const progressPercent = document.getElementById("upload-percent-text");
  const progressStatus = document.getElementById("upload-status-text");

  if (progressWrap) progressWrap.style.display = "flex";

  try {
    const res = await fetch(ENDPOINT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: selectedFile.name,
        contentType: selectedFile.type || "video/mp4",
        seriesId,
      }),
    });

    if (!res.ok) throw new Error(`Server returned status ${res.status}`);
    const { uploadUrl, publicUrl } = await res.json();

    if (progressStatus) progressStatus.textContent = "Uploading video directly to R2...";
    await uploadFileToR2(selectedFile, uploadUrl, (pct) => {
      if (progressFill) progressFill.style.width = `${pct}%`;
      if (progressPercent) progressPercent.textContent = `${pct}%`;
    });

    savePublishedEpisode({
      seriesId,
      seriesTitle,
      episodeNum: epNum,
      title: epTitle,
      videoUrl: publicUrl,
      posterUrl: "",
      coinPrice: price,
      synopsis: `Original series on Minsplay. Episode ${epNum}.`
    });

    showAppToast(`🎉 Episode ${epNum} Published Successfully!`);
    setTimeout(() => { navigateTo("/series", { seriesId }); }, 1200);
  } catch (err) {
    console.error(err);
    showAppToast(`Upload error: ${err.message}`);
    publishBtn.disabled = false;
    publishBtn.textContent = "Retry Publishing 🚀";
  }
}

function uploadFileToR2(file, uploadUrl, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === "function") {
        onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(true);
      else reject(new Error(`R2 upload rejected (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during direct R2 upload"));
    xhr.send(file);
  });
}

function renderCreatorCMSFeed() {
  const feed = document.getElementById("cms-series-feed");
  const countEl = document.getElementById("cms-total-count");
  if (!feed) return;

  if (countEl) countEl.textContent = `${DRAMA_CATALOG.length} Series in Active Catalog`;

  if (DRAMA_CATALOG.length === 0) {
    feed.innerHTML = `
      <div class="cms-empty-state">
        <span style="font-size: 2.2rem;">🎬</span>
        <p>No drama series uploaded yet.</p>
      </div>`;
    return;
  }

  feed.innerHTML = DRAMA_CATALOG.map((drama) => {
    const episodes = drama.episodes || [];
    return `
      <article class="cms-series-card" data-series-id="${drama.id}">
        <header class="cms-series-head">
          <div class="cms-series-title-wrap">
            <h3 class="cms-series-title">${drama.title}</h3>
            <span class="cms-series-sub">${drama.genre} • ${episodes.length} Episodes</span>
          </div>
          <button class="btn-cms-delete-series" data-action="delete-series" data-series="${drama.id}">
            Delete Series ✕
          </button>
        </header>

        <div class="cms-episodes-table">
          ${episodes.map((ep) => `
            <div class="cms-ep-card" data-ep-id="${ep.id}">
              <div class="cms-ep-card-top">
                <div class="cms-ep-title-cluster">
                  <span class="cms-ep-pill">EP ${ep.id}</span>
                  <strong class="cms-ep-name">${ep.title}</strong>
                </div>
                <span class="cms-price-badge ${ep.isFree ? 'free' : 'paid'}">
                  ${ep.isFree ? 'FREE' : '30 COINS'}
                </span>
              </div>
              
              <div class="cms-ep-card-bottom">
                <span class="cms-ep-meta-specs">🎬 Vertical 9:16 • Video Stream</span>
                <div class="cms-ep-btn-cluster">
                  <button class="btn-cms-action-pill edit" data-action="edit-ep" data-series="${drama.id}" data-ep="${ep.id}">
                    ✏️ Edit
                  </button>
                  <button class="btn-cms-action-pill delete" data-action="delete-ep" data-series="${drama.id}" data-ep="${ep.id}">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </article>
    `;
  }).join("");

  attachCMSFeedActions();
}

function attachCMSFeedActions() {
  const feed = document.getElementById("cms-series-feed");
  if (!feed) return;

  feed.onclick = (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const seriesId = btn.getAttribute("data-series");
    const epId = parseInt(btn.getAttribute("data-ep"), 10);

    if (action === "edit-ep") {
      openEditModal(seriesId, epId);
    } else if (action === "delete-ep") {
      deleteEpisode(seriesId, epId);
    } else if (action === "delete-series") {
      deleteSeries(seriesId);
    }
  };
}

function openEditModal(seriesId, epId) {
  currentEditingSeriesId = seriesId;
  currentEditingEpisodeId = epId;

  const drama = DRAMA_CATALOG.find((d) => d.id === seriesId);
  const ep = drama && drama.episodes.find((e) => e.id === epId);
  if (!ep) return;

  const modal = document.getElementById("cms-edit-modal");
  const titleInput = document.getElementById("cms-edit-ep-title");
  const priceSelect = document.getElementById("cms-edit-ep-price");
  const srcInput = document.getElementById("cms-edit-ep-src");

  if (titleInput) titleInput.value = ep.title;
  if (priceSelect) priceSelect.value = ep.isFree ? "0" : "30";
  if (srcInput) srcInput.value = ep.src || "";

  if (modal) modal.style.display = "flex";
}

function attachCMSEditModalEvents() {
  const modal = document.getElementById("cms-edit-modal");
  const closeBtn = document.getElementById("btn-close-cms-modal");
  const cancelBtn = document.getElementById("btn-cancel-cms-edit");
  const saveBtn = document.getElementById("btn-save-cms-edit");

  if (closeBtn) closeBtn.onclick = () => { if (modal) modal.style.display = "none"; };
  if (cancelBtn) cancelBtn.onclick = () => { if (modal) modal.style.display = "none"; };

  if (saveBtn) {
    saveBtn.onclick = () => {
      const title = document.getElementById("cms-edit-ep-title")?.value.trim();
      const price = parseInt(document.getElementById("cms-edit-ep-price")?.value || "0", 10);
      const src = document.getElementById("cms-edit-ep-src")?.value.trim();

      const drama = DRAMA_CATALOG.find((d) => d.id === currentEditingSeriesId);
      const ep = drama && drama.episodes.find((e) => e.id === currentEditingEpisodeId);

      if (ep) {
        if (title) ep.title = title;
        ep.isFree = price === 0;
        if (src) ep.src = src;

        saveCatalogToStorage();
        renderCreatorCMSFeed();
        if (modal) modal.style.display = "none";
        showAppToast("Episode metadata updated successfully! ✓");
      }
    };
  }
}

function deleteEpisode(seriesId, epId) {
  const drama = DRAMA_CATALOG.find((d) => d.id === seriesId);
  if (!drama) return;

  const idx = drama.episodes.findIndex((e) => e.id === epId);
  if (idx >= 0) {
    drama.episodes.splice(idx, 1);
    saveCatalogToStorage();
    renderCreatorCMSFeed();
    showAppToast(`Deleted Episode ${epId} 🗑️`);
  }
}

function deleteSeries(seriesId) {
  const idx = DRAMA_CATALOG.findIndex((d) => d.id === seriesId);
  if (idx >= 0) {
    const deletedName = DRAMA_CATALOG[idx].title;
    DRAMA_CATALOG.splice(idx, 1);
    saveCatalogToStorage();
    renderCreatorCMSFeed();
    showAppToast(`Deleted "${deletedName}" from catalog 🗑️`);
  }
}
