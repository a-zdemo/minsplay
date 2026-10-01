/* STREAMING_CHUNK:Configuring client-side validation and direct-to-R2 upload engine... */
import { showAppToast, navigateTo } from "./router.js";
import { DRAMA_CATALOG } from "./series-data.js";

// Your deployed Supabase Edge Function endpoint
const SUPABASE_FUNCTION_URL = "https://lekmsvdbthupiauejffo.supabase.co/functions/v1/get-upload-url";

let selectedFile = null;
let validatedSpecs = null;

export function initCreatorStudio() {
  const fileInput = document.getElementById("upload-video-file");
  const dropzone = document.getElementById("creator-video-dropzone");
  const idleContent = document.getElementById("dropzone-idle-content");
  const selectedContent = document.getElementById("dropzone-selected-content");
  const selectedFileName = document.getElementById("selected-file-name");
  const selectedFileSpecs = document.getElementById("selected-file-specs");
  const seriesSelect = document.getElementById("upload-series-select");
  const newSeriesGroup = document.getElementById("group-new-series-title");
  const publishBtn = document.getElementById("btn-publish-episode");

  if (!publishBtn) return;

  // Toggle custom series name field
  if (seriesSelect) {
    seriesSelect.onchange = () => {
      if (newSeriesGroup) {
        newSeriesGroup.style.display = seriesSelect.value === "new-series" ? "flex" : "none";
      }
    };
  }

  // Handle Video Selection & Metadata Inspection
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
        showAppToast(`Validation warning: ${err.message}`);
      }
    };
  }

  // Publish Episode Click Handler
  publishBtn.onclick = async () => {
    if (!selectedFile) {
      showAppToast("Please select an MP4 drama video first");
      return;
    }

    const titleInput = document.getElementById("upload-ep-title");
    const epNumInput = document.getElementById("upload-ep-num");
    const priceInput = document.getElementById("upload-ep-price");

    const epTitle = titleInput ? titleInput.value.trim() : "";
    const epNum = epNumInput ? parseInt(epNumInput.value, 10) : 1;
    const price = priceInput ? parseInt(priceInput.value, 10) : 0;
    const seriesId = seriesSelect ? seriesSelect.value : "the-beginning";

    if (!epTitle) {
      showAppToast("Please enter an episode subtitle");
      return;
    }

    publishBtn.disabled = true;
    publishBtn.textContent = "Requesting Upload Authorization...";

    const progressWrap = document.getElementById("upload-progress-wrap");
    const progressFill = document.getElementById("upload-progress-fill");
    const progressPercent = document.getElementById("upload-percent-text");
    const progressStatus = document.getElementById("upload-status-text");

    if (progressWrap) progressWrap.style.display = "flex";

    try {
      // 1. Request presigned upload URL from Supabase Edge Function
      const tokenRes = await fetch(SUPABASE_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selectedFile.name,
          contentType: selectedFile.type || "video/mp4",
          seriesId,
        }),
      });

      if (!tokenRes.ok) {
        throw new Error(`Edge Signer error (Status ${tokenRes.status})`);
      }

      const { uploadUrl, publicUrl } = await tokenRes.json();
      if (!uploadUrl) throw new Error("Edge Function did not return presigned URL");

      // 2. Stream chunk directly to Cloudflare R2
      if (progressStatus) progressStatus.textContent = "Direct-to-R2 streaming in progress...";

      await uploadToR2WithProgress(selectedFile, uploadUrl, (pct) => {
        if (progressFill) progressFill.style.width = `${pct}%`;
        if (progressPercent) progressPercent.textContent = `${pct}%`;
      });

      // 3. Register newly published episode in local catalog
      commitPublishedEpisode(seriesId, epNum, epTitle, publicUrl, price);

      if (progressStatus) progressStatus.textContent = "Upload Complete!";
      showAppToast("🎉 Episode Published Successfully to Cloudflare R2!");

      setTimeout(() => {
        navigateTo("/series", { seriesId });
      }, 1500);
    } catch (err) {
      console.error("Creator upload error:", err);
      showAppToast(`Upload Failed: ${err.message}`);
      publishBtn.disabled = false;
      publishBtn.textContent = "Retry Publishing 🚀";
    }
  };
}

function validateVideoFile(file) {
  return new Promise((resolve, reject) => {
    const validTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!validTypes.includes(file.type)) {
      return reject(new Error("Please upload an MP4 or WebM video file."));
    }

    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";

    tempVideo.onloadedmetadata = () => {
      window.URL.revokeObjectURL(tempVideo.src);
      const durationSec = Math.floor(tempVideo.duration) || 10;
      const width = tempVideo.videoWidth || 720;
      const height = tempVideo.videoHeight || 1280;

      if (durationSec > 180) {
        return reject(new Error(`Video duration (${durationSec}s) exceeds the 3-minute episode cap.`));
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
  const drama = DRAMA_CATALOG.find((d) => d.id === seriesId);
  if (drama) {
    drama.episodes.push({
      id: episodeId,
      title,
      duration: "0m 10s",
      isFree: coinPrice === 0,
      src,
    });
  }
}
