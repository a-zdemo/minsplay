import { showAppToast, navigateTo } from "./router.js";
import { DRAMA_CATALOG, savePublishedEpisode } from "./series-data.js";

const ENDPOINT_URL = "https://lekmsvdbthupiauejffo.supabase.co/functions/v1/smart-responder";

let selectedFile = null;
let capturedThumbnail = null; // { dataUrl, blob }

export function initCreatorStudio() {
  const fileInput = document.getElementById("upload-video-file");
  const idleContent = document.getElementById("dropzone-idle-content");
  const selectedContent = document.getElementById("dropzone-selected-content");
  const selectedFileName = document.getElementById("selected-file-name");
  const selectedFileSpecs = document.getElementById("selected-file-specs");
  const previewThumbImg = document.getElementById("dropzone-thumb-preview");
  const seriesSelect = document.getElementById("upload-series-select");
  const newSeriesGroup = document.getElementById("group-new-series-title");
  const publishBtn = document.getElementById("btn-publish-episode");

  if (!publishBtn) return;

  // Populate Series Select with existing custom series
  if (seriesSelect) {
    const existingOptions = DRAMA_CATALOG.map(
      (d) => `<option value="${d.id}">${d.title}</option>`
    ).join("");
    seriesSelect.innerHTML = existingOptions + `<option value="new-series">+ Create New Drama Series...</option>`;
    
    // Default to 'new-series' if no dramas exist yet
    if (DRAMA_CATALOG.length === 0) {
      seriesSelect.value = "new-series";
      if (newSeriesGroup) newSeriesGroup.style.display = "flex";
    }

    seriesSelect.onchange = () => {
      if (newSeriesGroup) {
        newSeriesGroup.style.display = seriesSelect.value === "new-series" ? "flex" : "none";
      }
    };
  }

  if (fileInput) {
    fileInput.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      showAppToast("Analyzing video & extracting cover thumbnail...");

      try {
        const thumbResult = await extractVideoThumbnail(file);
        selectedFile = file;
        capturedThumbnail = thumbResult;

        if (idleContent) idleContent.style.display = "none";
        if (selectedContent) selectedContent.style.display = "flex";
        if (selectedFileName) selectedFileName.textContent = file.name;
        if (selectedFileSpecs) {
          selectedFileSpecs.textContent = `${(file.size / (1024 * 1024)).toFixed(1)}MB • Thumbnail Captured ✓`;
        }
        if (previewThumbImg && thumbResult.dataUrl) {
          previewThumbImg.src = thumbResult.dataUrl;
          previewThumbImg.style.display = "block";
        }
        showAppToast("Video and cover thumbnail ready! ✓");
      } catch (err) {
        selectedFile = null;
        capturedThumbnail = null;
        fileInput.value = "";
        if (idleContent) idleContent.style.display = "flex";
        if (selectedContent) selectedContent.style.display = "none";
        showAppToast(`Notice: ${err.message}`);
      }
    };
  }

  publishBtn.onclick = async () => {
    if (!selectedFile) {
      showAppToast("Please select a video file first");
      return;
    }

    const titleInput = document.getElementById("upload-ep-title");
    const epNumInput = document.getElementById("upload-ep-num");
    const priceInput = document.getElementById("upload-ep-price");
    const newSeriesTitleInput = document.getElementById("upload-new-series-title");

    let seriesId = seriesSelect ? seriesSelect.value : "new-series";
    let seriesTitle = "";

    if (seriesId === "new-series" || DRAMA_CATALOG.length === 0) {
      const customTitle = newSeriesTitleInput ? newSeriesTitleInput.value.trim() : "";
      seriesTitle = customTitle || "Original Series";
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
      // 1. Upload Video to R2
      if (progressStatus) progressStatus.textContent = "Requesting video token...";
      const videoToken = await fetchUploadToken(selectedFile.name, selectedFile.type || "video/mp4", seriesId);

      if (progressStatus) progressStatus.textContent = "Uploading video to Cloudflare R2...";
      await uploadToR2WithProgress(selectedFile, videoToken.uploadUrl, selectedFile.type || "video/mp4", (pct) => {
        if (progressFill) progressFill.style.width = `${pct}%`;
        if (progressPercent) progressPercent.textContent = `${pct}%`;
      });

      // 2. Upload Extracted Thumbnail Frame to R2
      let finalPosterUrl = capturedThumbnail ? capturedThumbnail.dataUrl : "";
      if (capturedThumbnail && capturedThumbnail.blob) {
        try {
          if (progressStatus) progressStatus.textContent = "Uploading cover thumbnail...";
          const thumbFilename = `thumb_${Date.now()}.jpg`;
          const thumbToken = await fetchUploadToken(thumbFilename, "image/jpeg", seriesId);
          await uploadToR2WithProgress(capturedThumbnail.blob, thumbToken.uploadUrl, "image/jpeg");
          finalPosterUrl = thumbToken.publicUrl || finalPosterUrl;
        } catch (thumbErr) {
          console.warn("Thumbnail upload fallback to dataURL:", thumbErr);
        }
      }

      // 3. Commit new series and episode into persistent catalog
      savePublishedEpisode({
        seriesId,
        seriesTitle,
        episodeNum: epNum,
        title: epTitle,
        videoUrl: videoToken.publicUrl,
        posterUrl: finalPosterUrl,
        coinPrice: price,
        synopsis: `Original series by Minsplay Creator. Episode ${epNum}.`
      });

      if (progressStatus) progressStatus.textContent = "Upload Complete!";
      showAppToast("🎉 Episode & Cover Published to Cloudflare Vault!");

      setTimeout(() => {
        navigateTo("/series", { seriesId });
      }, 1200);
    } catch (err) {
      console.error("Upload error:", err);
      showAppToast(`Upload Failed: ${err.message}`);
      publishBtn.disabled = false;
      publishBtn.textContent = "Retry Publishing 🚀";
      if (progressStatus) progressStatus.textContent = "Upload Interrupted";
    }
  };
}

async function fetchUploadToken(filename, contentType, seriesId) {
  const res = await fetch(ENDPOINT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, contentType, seriesId }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Edge Signer error (${res.status}): ${errText || "Rejected"}`);
  }
  return await res.json();
}

// Extracts a clear frame at t=1.0s onto an HTML5 Canvas
function extractVideoThumbnail(file) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1.0, (video.duration || 2) * 0.2);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 720;
        canvas.height = video.videoHeight || 1280;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl);
          resolve({ dataUrl, blob });
        }, "image/jpeg", 0.85);
      } catch (e) {
        URL.revokeObjectURL(objectUrl);
        resolve({ dataUrl: null, blob: null });
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ dataUrl: null, blob: null });
    };
  });
}

function uploadToR2WithProgress(blobOrFile, uploadUrl, contentType, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", contentType);

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
    xhr.send(blobOrFile);
  });
}
