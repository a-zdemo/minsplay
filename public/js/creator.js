import { showAppToast, navigateTo } from "./router.js";
import { savePublishedEpisode, DRAMA_CATALOG } from "./series-data.js";

const ENDPOINT_URL = "https://lekmsvdbthupiauejffo.supabase.co/functions/v1/smart-responder";

let selectedFile = null;

export function initCreatorStudio() {
  const fileInput = document.getElementById("upload-video-file");
  const seriesSelect = document.getElementById("upload-series-select");
  const newSeriesGroup = document.getElementById("group-new-series-title");
  const publishBtn = document.getElementById("btn-publish-episode");

  if (!publishBtn) return;

  // Populate series dropdown with current catalog series
  if (seriesSelect) {
    const options = DRAMA_CATALOG.map((d) => `<option value="${d.id}">${d.title}</option>`).join("");
    seriesSelect.innerHTML = options + `<option value="new-series">+ Create New Drama Series...</option>`;
    
    seriesSelect.onchange = () => {
      if (newSeriesGroup) {
        newSeriesGroup.style.display = seriesSelect.value === "new-series" ? "flex" : "none";
      }
    };
  }

  // File selection
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
      showAppToast("Video file selected ✓");
    };
  }

  // Publish button
  publishBtn.onclick = async () => {
    if (!selectedFile) {
      showAppToast("Please select a video file first");
      return;
    }

    const titleInput = document.getElementById("upload-ep-title");
    const epNumInput = document.getElementById("upload-ep-num");
    const priceInput = document.getElementById("upload-ep-price");
    const newTitleInput = document.getElementById("upload-new-series-title");

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
      // 1. Request presigned upload token
      if (progressStatus) progressStatus.textContent = "Authorizing R2 storage...";
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

      // 2. Stream directly to Cloudflare R2
      if (progressStatus) progressStatus.textContent = "Uploading video directly to R2...";
      await uploadFileToR2(selectedFile, uploadUrl, (pct) => {
        if (progressFill) progressFill.style.width = `${pct}%`;
        if (progressPercent) progressPercent.textContent = `${pct}%`;
      });

      // 3. Commit exact metadata entered in the form
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

      if (progressStatus) progressStatus.textContent = "Upload Complete!";
      showAppToast(`🎉 Episode ${epNum} Published Successfully!`);

      setTimeout(() => {
        navigateTo("/series", { seriesId });
      }, 1200);
    } catch (err) {
      console.error(err);
      showAppToast(`Upload error: ${err.message}`);
      publishBtn.disabled = false;
      publishBtn.textContent = "Retry Publishing 🚀";
      if (progressStatus) progressStatus.textContent = "Upload Interrupted";
    }
  };
}

function uploadFileToR2(file, uploadUrl, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === "function") {
        const pct = Math.min(100, Math.round((e.loaded / e.total) * 100));
        onProgress(pct);
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
