import { showAppToast, navigateTo } from "./router.js";
import { getCurrentUser } from "./auth.js";
import { activateVip, getVipData, getUserCoins } from "./storage.js";

const SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDY4MjEsImV4cCI6MjEwNjM4MjgyMX0.26Lu_-rQX17LKXOSJ98d2OPRYIkfW_7S-8WaMsxqqeg";

let timerInterval = null;
let selectedPlan = "weekly";

export function initMemberPage() {
  startDiscountTimer();
  setupPlanSelectors();
  setupSheetEvents();
}

function startDiscountTimer() {
  const timerEl = document.getElementById("member-timer-text");
  if (!timerEl) return;
  if (timerInterval) clearInterval(timerInterval);

  let secondsLeft = 59 * 60 + 44; // 00:59:44
  function update() {
    const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const secs = String(secondsLeft % 60).padStart(2, "0");
    timerEl.textContent = `Discount 00:${mins}:${secs}`;
    if (secondsLeft > 0) secondsLeft--;
    else secondsLeft = 59 * 60;
  }
  update();
  timerInterval = setInterval(update, 1000);
}

function setupPlanSelectors() {
  const cards = document.querySelectorAll(".db-membership-plan-card");
  cards.forEach((card) => {
    card.onclick = () => {
      cards.forEach((c) => {
        c.classList.remove("selected");
        const radio = c.querySelector(".plan-radio-circle");
        if (radio) radio.classList.remove("checked");
      });
      card.classList.add("selected");
      const radio = card.querySelector(".plan-radio-circle");
      if (radio) radio.classList.add("checked");
      selectedPlan = card.getAttribute("data-plan") || "weekly";
    };
  });

  const joinBtn = document.getElementById("btn-member-join-now");
  if (joinBtn) {
    joinBtn.onclick = () => openGooglePlaySheet();
  }
}

function openGooglePlaySheet() {
  const sheet = document.getElementById("google-play-modal");
  const priceToday = document.getElementById("gp-price-today");
  const priceFuture = document.getElementById("gp-price-future");
  const dateFuture = document.getElementById("gp-date-future");

  const future = new Date();
  future.setDate(future.getDate() + (selectedPlan === "weekly" ? 21 : 365));
  const dateStr = future.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (selectedPlan === "weekly") {
    if (priceToday) priceToday.textContent = "₦6,810.00/week";
    if (priceFuture) priceFuture.textContent = "₦10,000.00/week";
    if (dateFuture) dateFuture.textContent = `Starting ${dateStr}`;
  } else {
    if (priceToday) priceToday.textContent = "₦83,500.00/year";
    if (priceFuture) priceFuture.textContent = "₦83,500.00/year";
    if (dateFuture) dateFuture.textContent = `Renews ${dateStr}`;
  }

  if (sheet) sheet.style.display = "flex";
}

function setupSheetEvents() {
  const sheet = document.getElementById("google-play-modal");
  const closeBtn = document.getElementById("btn-close-google-play");
  const subBtn = document.getElementById("btn-google-play-subscribe");

  if (closeBtn) closeBtn.onclick = () => { if (sheet) sheet.style.display = "none"; };
  if (sheet) sheet.onclick = (e) => { if (e.target === sheet) sheet.style.display = "none"; };

  if (subBtn) {
    subBtn.onclick = async () => {
      subBtn.disabled = true;
      subBtn.textContent = "Processing Subscription...";

      const user = getCurrentUser();
      const planDays = selectedPlan === "weekly" ? 7 : 365;
      const amount = selectedPlan === "weekly" ? 6810 : 83500;

      try {
        await fetch(`${SUPABASE_URL}/rest/v1/reward_transactions`, {
          method: "POST",
          headers: {
            "apikey": ANON_KEY,
            "Authorization": `Bearer ${ANON_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({
            user_id: user.id || "guest_" + (localStorage.getItem("minsplay_guest_id") || "432655107"),
            type: "membership_subscription",
            amount: -amount,
            reference: `gp_sub_${Date.now()}`
          })
        }).catch(() => {});
      } catch (err) {}

      activateVip(selectedPlan, planDays);
      if (sheet) sheet.style.display = "none";
      subBtn.disabled = false;
      subBtn.textContent = "Subscribe";
      showAppToast("🎉 Membership Activated! Unlimited VIP Access Granted.");
      navigateTo("/profile");
    };
  }
}
