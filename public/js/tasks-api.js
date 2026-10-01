const SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NzI2NzgsImV4cCI6MjA1OTA0ODY3OH0.S6t81vD666-jE5H0e1t-cRk5Jk9kX-7gN1m2z3y4x5w";

const HEADERS = {
  "apikey": ANON_KEY,
  "Authorization": `Bearer ${ANON_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};

/**
 * Fetches all active reward tasks sorted by priority from Supabase
 */
export async function fetchLiveTasks() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reward_tasks?select=*&order=sort_order.asc`, {
      method: "GET",
      headers: HEADERS
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : null;
  } catch (err) {
    console.warn("[Tasks API] Falling back to offline defaults:", err);
    return null;
  }
}

/**
 * Creates or updates a task in the Supabase database
 */
export async function upsertTaskInDatabase(task) {
  try {
    const payload = {
      id: task.id,
      title: task.title,
      description: task.desc || task.description || `+ ${task.reward_coins || task.reward || 30} reward coins`,
      reward_coins: Number(task.reward_coins || task.reward || 30),
      icon: task.icon || "🎁",
      action_type: task.action_type || task.actionType || "ad",
      btn_label: task.btn_label || task.btnLabel || "Go",
      target_url: task.target_url || task.url || null,
      max_progress: Number(task.max_progress || task.maxProgress || 1),
      is_active: true,
      updated_at: new Date().toISOString()
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/reward_tasks`, {
      method: "POST",
      headers: { ...HEADERS, "Prefer": "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Database error: HTTP ${res.status}`);
    return true;
  } catch (err) {
    console.error("[Tasks API] Upsert failed:", err);
    return false;
  }
}

/**
 * Deletes a task permanently from the Supabase database
 */
export async function deleteTaskFromDatabase(taskId) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reward_tasks?id=eq.${encodeURIComponent(taskId)}`, {
      method: "DELETE",
      headers: HEADERS
    });
    return res.ok;
  } catch (err) {
    console.error("[Tasks API] Delete failed:", err);
    return false;
  }
}
