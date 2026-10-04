import { showRewardedVideo } from "./admob-manager.js";
import { getUserCoins, addCoins } from "./storage.js";
import { showAppToast, navigateTo } from "./router.js";
import { fetchLiveTasks } from "./tasks-api.js";

export const REWARD_TASKS_KEY = "minsplay_reward_tasks_v2";

export const DEFAULT_TASKS = [
  { id: "task_tg", title: "Join Telegram Channel", desc: "+ 30 reward coins", reward: 30, icon: "✈️", actionType: "telegram", btnLabel: "Go", url: "https://t.me/minsplay", completed: false },
  { id: "task_ad_loop", title: "Earn rewards (0/15)", desc: "Watch a video to earn 20 coins", reward: 20, icon: "📹", actionType: "ad", btnLabel: "Watch", progress: 0, maxProgress: 15 },
  { id: "task_big_coins", title: "Get more coins", desc: "Up to 9999 coins", reward: 50, icon: "🎁", actionType: "vip", btnLabel: "Go", completed: false },
  { id: "task_invite", title: "Invite friends", desc: "Earn up to 500 coins daily", reward: 50, icon: "👤", actionType: "invite", btnLabel: "Invite", completed: false },
  { id: "task_share", title: "Share with friends", desc: "+ 30 Reward coins", reward: 30, icon: "↗️", actionType: "share", btnLabel: "Go", completed: false },
  { id: "task_watch_5m", title: "Watch for 5 mins", desc: "+ 10 Reward coins", reward: 10, icon: "🕒", actionType: "watch", btnLabel: "Go", completed: false },
  { id: "task_watch_15m", title: "Watch for 15 mins", desc: "+ 20 Reward coins", reward: 20, icon: "🕒", actionType: "watch", btnLabel: "Go", completed: false }
];

export function getStoredTasks() {
  try {
    const raw = localStorage.getItem(REWARD_TASKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...DEFAULT_TASKS];
}

export function saveStoredTasks(tasks) {
  try {
    localStorage.setItem(REWARD_TASKS_KEY, JSON.stringify(tasks));
  } catch (e) {}
}

export async function syncTasksFromSupabase() {
  const liveTasks = await fetchLiveTasks();
  if (liveTasks && liveTasks.length > 0) {
    const localTasks = getStoredTasks();
    const mapped = liveTasks.map((dbTask) => {
      const local = localTasks.find((t) => t.id === dbTask.id);
      return {
        id: dbTask.id,
        title: dbTask.title,
        desc: dbTask.description || `+ ${dbTask.reward_coins} reward coins`,
        reward: dbTask.reward_coins,
        icon: dbTask.icon || "🎁",
        actionType: dbTask.action_type || "ad",
        btnLabel: dbTask.btn_label || "Go",
        url: dbTask.target_url,
        progress: (local && local.progress) || 0,
        maxProgress: dbTask.max_progress || 1,
        completed: (local && local.completed) || false
      };
    });
    saveStoredTasks(mapped);
    renderRewardsTasksList();
  }
}

export function renderRewardsTasksList() {
  const container = document.getElementById("rewards-tasks-list");
  if (!container) return;

  const tasks = getStoredTasks();

  container.innerHTML = tasks.map((task) => `
    <article class="reward-task-card" data-task-id="${task.id}">
      <div class="task-icon-circle">${task.icon || '🎁'}</div>
      <div class="task-info-block">
        <strong class="task-main-title">${task.title}</strong>
        <span class="task-sub-desc">${task.desc}</span>
      </div>
      <button class="btn-task-action ${task.completed ? 'completed' : ''}" data-task-action="${task.id}" type="button">
        ${task.completed ? 'Claimed ✓' : (task.btnLabel || 'Go')}
      </button>
    </article>
  `).join("");
}

export function attachRewardsTaskListeners() {
  const container = document.getElementById("rewards-tasks-list");
  const bannerAdBtn = document.getElementById("btn-top-banner-ad");
  const rulesPill = document.getElementById("btn-rewards-rules-pill");

  if (bannerAdBtn) {
    bannerAdBtn.onclick = () => {
      triggerRewardedAd(30, "Top Ad Reward");
    };
  }

  if (rulesPill) {
    rulesPill.onclick = (e) => {
      e.stopPropagation();
      showAppToast("Complete daily tasks & watch ads to claim free coins! 🎁");
    };
  }

  if (container) {
    container.onclick = (e) => {
      const btn = e.target.closest("[data-task-action]");
      if (!btn) return;

      const taskId = btn.getAttribute("data-task-action");
      const tasks = getStoredTasks();
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.completed) return;

      executeRewardTask(task, tasks);
    };
  }
}

function executeRewardTask(task, tasks) {
  if (task.actionType === "ad") {
    triggerRewardedAd(task.reward || 20, task.title, () => {
      task.progress = (task.progress || 0) + 1;
      task.title = `Earn rewards (${task.progress}/${task.maxProgress || 15})`;
      if (task.progress >= (task.maxProgress || 15)) {
        task.completed = true;
      }
      saveStoredTasks(tasks);
      renderRewardsTasksList();
    });
  } else if (task.actionType === "telegram") {
    window.open(task.url || "https://t.me/minsplay", "_blank");
    addCoins(task.reward || 30);
    task.completed = true;
    saveStoredTasks(tasks);
    renderRewardsTasksList();
    showAppToast(`🎉 Joined Telegram! +${task.reward} Coins credited.`);
  } else if (task.actionType === "share") {
    if (navigator.share) {
      navigator.share({ title: "Minsplay Short Dramas", url: window.location.origin }).catch(() => {});
    }
    addCoins(task.reward || 30);
    task.completed = true;
    saveStoredTasks(tasks);
    renderRewardsTasksList();
    showAppToast(`🎉 Shared Minsplay! +${task.reward} Coins credited.`);
  } else if (task.actionType === "invite") {
    const inviteUrl = `${window.location.origin}/?ref=MINS-84920`;
    navigator.clipboard?.writeText(inviteUrl);
    showAppToast("Invite link copied to clipboard! Share with friends 📋");
    addCoins(task.reward || 50);
    task.completed = true;
    saveStoredTasks(tasks);
    renderRewardsTasksList();
  } else if (task.actionType === "watch") {
    showAppToast("Binge dramas to earn! Opening watch feed... ▶");
    setTimeout(() => { navigateTo("/watch"); }, 800);
  } else if (task.actionType === "vip") {
    navigateTo("/member");
  } else {
    addCoins(task.reward || 20);
    task.completed = true;
    saveStoredTasks(tasks);
    renderRewardsTasksList();
    showAppToast(`🎉 Task Complete! +${task.reward} Coins credited.`);
  }
}

function triggerRewardedAd(rewardCoins, taskName, onComplete) {
  showRewardedVideo({
    placement: "rewards_loop",
    onReward: () => {
      addCoins(rewardCoins);
      showAppToast(`🎁 Reward granted! +${rewardCoins} Coins added.`);
      if (typeof onComplete === "function") onComplete();
    },
    onDismiss: () => {
      showAppToast("Watch the full ad to earn coins.");
    }
  });
}

export function initRewardsPage() {
  const tabCoins = document.getElementById("tab-rewards-coins");
  const tabPoints = document.getElementById("tab-rewards-points");
  const paneCoins = document.getElementById("pane-rewards-coins");
  const panePoints = document.getElementById("pane-rewards-points");

  if (tabCoins && tabPoints) {
    tabCoins.onclick = () => {
      tabCoins.classList.add("active");
      tabPoints.classList.remove("active");
      if (paneCoins) paneCoins.style.display = "flex";
      if (panePoints) panePoints.style.display = "none";
    };
    tabPoints.onclick = () => {
      tabPoints.classList.add("active");
      tabCoins.classList.remove("active");
      if (paneCoins) paneCoins.style.display = "none";
      if (panePoints) panePoints.style.display = "flex";
    };
  }

  renderRewardsTasksList();
  attachRewardsTaskListeners();
  syncTasksFromSupabase();
}
