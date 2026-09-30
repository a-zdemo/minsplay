import { getSubtitleCues } from "./subtitles-data.js";
import { showAppToast } from "./router.js";

const SUBTITLES_KEY = "minsplay_subtitles_lang";
let activeLanguage = localStorage.getItem(SUBTITLES_KEY) || "en";

export function initSubtitlesSystem() {
  document.addEventListener("click", (e) => {
    // 1. CC Button in HUD toggles the language selector modal
    if (e.target.closest("#btn-cc-toggle")) {
      openSubtitlesModal();
      return;
    }

    // 2. Close modal triggers
    if (e.target.closest("#btn-close-subtitles-modal")) {
      closeSubtitlesModal();
      return;
    }
    const modalBackdrop = document.getElementById("subtitles-modal-backdrop");
    if (e.target === modalBackdrop) {
      closeSubtitlesModal();
      return;
    }

    // 3. Language selection option
    const langBtn = e.target.closest(".sub-lang-option");
    if (langBtn) {
      const selectedLang = langBtn.getAttribute("data-lang");
      setSubtitleLanguage(selectedLang);
      closeSubtitlesModal();
      return;
    }
  });

  // Track video time to render matching subtitle cues
  document.addEventListener("timeupdate", (e) => {
    const video = e.target;
    if (video && video.id === "minsplay-video") {
      renderActiveSubtitleCue(video.currentTime);
    }
  }, true);
}

function openSubtitlesModal() {
  const modal = document.getElementById("subtitles-modal-backdrop");
  if (!modal) return;

  syncModalRadioOptions();
  modal.style.display = "flex";
}

function closeSubtitlesModal() {
  const modal = document.getElementById("subtitles-modal-backdrop");
  if (modal) modal.style.display = "none";
}

function syncModalRadioOptions() {
  const options = document.querySelectorAll(".sub-lang-option");
  options.forEach((opt) => {
    const lang = opt.getAttribute("data-lang");
    const isSelected = lang === activeLanguage;
    opt.classList.toggle("selected", isSelected);
    const radio = opt.querySelector(".sub-lang-radio");
    if (radio) radio.textContent = isSelected ? "✓" : "";
  });

  const ccBtn = document.getElementById("btn-cc-toggle");
  if (ccBtn) {
    ccBtn.classList.toggle("active", activeLanguage !== "off");
  }
}

function setSubtitleLanguage(lang) {
  activeLanguage = lang;
  localStorage.setItem(SUBTITLES_KEY, lang);
  syncModalRadioOptions();

  const labels = {
    off: "Subtitles Off",
    en: "English Subtitles 🇬🇧",
    es: "Subtítulos en Español 🇪🇸",
    id: "Subtitel Bahasa Indonesia 🇮🇩"
  };

  showAppToast(labels[lang] || "Subtitles Updated");

  // If set to off, immediately clear the cue overlay
  if (lang === "off") {
    const cueEl = document.getElementById("subtitles-cue");
    if (cueEl) {
      cueEl.textContent = "";
      cueEl.style.display = "none";
    }
  }
}

function getActivePlaybackContext() {
  const epBadge = document.getElementById("watch-ep-badge");
  const epNum = epBadge ? parseInt(epBadge.textContent.replace(/\D/g, ""), 10) : 1;
  const urlParams = new URLSearchParams(window.location.search);
  const seriesId = urlParams.get("id") || "the-beginning";
  return { seriesId, episodeId: epNum || 1 };
}

function renderActiveSubtitleCue(currentTime) {
  const cueEl = document.getElementById("subtitles-cue");
  if (!cueEl) return;

  if (activeLanguage === "off") {
    cueEl.textContent = "";
    cueEl.style.display = "none";
    return;
  }

  const { seriesId, episodeId } = getActivePlaybackContext();
  const cues = getSubtitleCues(seriesId, episodeId, activeLanguage);

  const matched = cues.find((c) => currentTime >= c.start && currentTime <= c.end);

  if (matched) {
    if (cueEl.textContent !== matched.text) {
      cueEl.textContent = matched.text;
      cueEl.style.display = "inline-block";
    }
  } else {
    cueEl.textContent = "";
    cueEl.style.display = "none";
  }
}
