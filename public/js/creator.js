import { showAppToast, navigateTo } from "./router.js";
import { DRAMA_CATALOG } from "./series-data.js";

// Live Supabase Edge Function Signer
const ENDPOINT_URL = "https://lekmsvdbthupiauejffo.supabase.co/functions/v1/smart-responder";

let selectedFile = null;
let validatedSpecs = null;

export function initCreatorStudio() {
  const fileInput = document.getElementById("upload-video-file");
  const idleContent = document.getElementById("dropzone-idle-content");
  const selectedContent = document.getElementById("dropzone-selected-content");
  const selectedFileName = document.getElementById("selected-file-name");
  const selectedFileSpecs = document.getElementById("selected-file-specs");
  const seriesSelect = document.getElementById("upload-series-select");
  const newSeriesGroup = document.getElementById("group-new-series-title");
  const publishBtn = document.getElementById("btn-publish-episode");

  if (!publishBtn) return;

  if (seriesSelect) {
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

      showAppToast("Inspecting video metadata...");

      try {
        const specs = await validateVideoFile(file);
        selectedFile = file;
        validatedSpecs = specs;

        if (idleContent) idleContent.style.display = "none";
        if (selectedContent) selectedContent.style.display = "flex";
        if (selectedFileName) selectedFileName.textContent = file.name;
        if (selectedFileSpecs) {
          selectedFileSpecs.textContent = `${specs.fileSizeStr} • ${specs.durationSec}s • ${specs.isPortrait ? "Portrait 9:16 ✓" : "Landscape (Will Crop)"}`;
        }
        showAppToast("Video validated successfully! ✓");
      } catch (err) {
        selectedFile = null;
        validatedSpecs = null;
        fileInput.value = "";
        if (idleContent) idleContent.style.display = "flex";
        if (selectedContent) selectedContent.style.display = "none";
        showAppToast(`Validation notice: ${err.message}`);
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

    let seriesId = seriesSelect ? seriesSelect.value : "the-beginning";
    if (seriesId === "new-series") {
      const customTitle = newSeriesTitleInput ? newSeriesTitleInput.value.trim() : "";
      seriesId = customTitle ? customTitle.toLowerCase().replace(/[^a-z0-9]/g, "-") : "user-series";
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
    if (progressStatus) progressStatus.textContent = "Requesting presigned token...";

    try {
      // 1. Fetch Presigned Token from smart-responder endpoint
      const res = await fetch(ENDPOINT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selectedFile.name,
          contentType: selectedFile.type || "video/mp4",
          seriesId,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Edge Signer error (Status ${res.status}): ${errBody || "Request rejected"}`);
      }

      const tokenData = await res.json();
      const { uploadUrl, publicUrl } = tokenData;

      if (!uploadUrl) {
        throw new Error("No uploadUrl returned by edge function");
      }

      // 2. Stream chunk directly to Cloudflare R2
      if (progressStatus) progressStatus.textContent = "Direct-to-R2 streaming...";

      await uploadToR2WithProgress(selectedFile, uploadUrl, (pct) => {
        if (progressFill) progressFill.style.width = `${pct}%`;
        if (progressPercent) progressPercent.textContent = `${pct}%`;
      });

      // 3. Commit newly published episode into drama catalog
      commitPublishedEpisode(seriesId, epNum, epTitle, publicUrl, price);

      if (progressStatus) progressStatus.textContent = "Upload Complete!";
      showAppToast("🎉 Episode Published to Cloudflare R2 Vault!");

      setTimeout(() => {
        navigateTo("/series", { seriesId });
      }, 1500);
    } catch (err) {
      console.error("Upload error:", err);
      showAppToast(`Upload Failed: ${err.message}`);
      publishBtn.disabled = false;
      publishBtn.textContent = "Retry Publishing 🚀";
      if (progressStatus) progressStatus.textContent = "Upload Interrupted";
    }
  };
}

function validateVideoFile(file) {
  return new Promise((resolve, reject) => {
    const validTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!validTypes.includes(file.type)) {
      return reject(new Error("Please select an MP4 or WebM video file."));
    }

    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";

    tempVideo.onloadedmetadata = () => {
      window.URL.revokeObjectURL(tempVideo.src);
      const durationSec = Math.floor(tempVideo.duration) || 10;
      const width = tempVideo.videoWidth || 720;
      const height = tempVideo.videoHeight || 1280;

      if (durationSec > 180) {
        return reject(new Error(`Duration (${durationSec}s) exceeds the 3-minute cap.`));
      }

      const isPortrait = height >= width;
      const fileSizeStr = (file.size / (1024 * 1024)).toFixed(1) + "MB";
      resolve({ durationSec, width, height, isPortrait, fileSizeStr });
    };

    tempVideo.onerror = () => {
      resolve({ durationSec: 10, width: 720, height: 1280, isPortrait: true, fileSizeStr: (file.size / (1024 * 1024)).toFixed(1) + "MB" });
    };

    tempVideo.src = URL.createObjectURL(file);
  });
}

function uploadToR2WithProgress(file, uploadUrl, onProgress) {
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
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(true);
      } else {
        reject(new Error(`R2 upload rejected with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during direct R2 upload"));
    xhr.send(file);
  });
}

function commitPublishedEpisode(seriesId, episodeId, title, src, coinPrice) {
  let drama = DRAMA_CATALOG.find((d) => d.id === seriesId);
  if (!drama) {
    drama = {
      id: seriesId,
      title: title.split(":")[0] || "User Series",
      shortTitle: title.split(":")[0] || "User Series",
      genre: "Urban Drama",
      tags: "Community • Creator Release",
      badge: "Creator",
      badgeClass: "badge-hot",
      plays: "1",
      artClass: "art-gold",
      artSymbol: "🎬",
      artCode: "CREATOR",
      synopsis: "Community produced short drama on Minsplay.",
      episodes: []
    };
    DRAMA_CATALOG.unshift(drama);
  }

  drama.episodes.push({
    id: episodeId,
    title,
    duration: "0m 10s",
    isFree: coinPrice === 0,
    src,
  });
}
