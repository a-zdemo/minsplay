# 1. Update public/js/auth.js to save and fetch creator apps via Supabase REST
with open("public/js/auth.js", "r", encoding="utf-8") as f:
    auth_code = f.read()

new_creator_fns = """export async function submitCreatorApplication(studioName, bio) {
  const user = getCurrentUser();
  if (!user.email || user.role === ROLES.GUEST) {
    showAppToast("Please log in to apply for Creator Studio 🔒");
    navigateTo("/auth");
    return false;
  }
  const payload = {
    id: "app_" + Date.now(),
    user_id: user.id || user.email,
    username: user.username || user.email.split("@")[0],
    email: user.email,
    studio_name: studioName.trim() || user.username + " Studios",
    bio: bio.trim() || "Vertical drama creator.",
    status: "pending"
  };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/creator_applications`, {
      method: "POST",
      headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Supabase insert failed");
    saveCurrentUser({ ...user, creatorStatus: "pending" });
    showAppToast("Creator application submitted successfully! 🎬");
    return true;
  } catch (err) {
    showAppToast("Submission failed: " + err.message);
    return false;
  }
}

export async function getCreatorApplications() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/creator_applications?order=applied_at.desc`, {
      headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` }
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return rows.map(r => ({
      id: r.id, userId: r.user_id, username: r.username, email: r.email,
      studioName: r.studio_name, bio: r.bio, status: r.status, appliedAt: r.applied_at
    }));
  } catch { return []; }
}

export async function reviewCreatorApplication(appId, approve = true) {
  try {
    const status = approve ? "approved" : "rejected";
    const res = await fetch(`${SUPABASE_URL}/rest/v1/creator_applications?id=eq.${appId}`, {
      method: "PATCH",
      headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewed_at: new Date().toISOString() })
    });
    if (!res.ok) throw new Error("Update failed");
    showAppToast(approve ? "Approved Creator Studio! 🎬" : "Application rejected");
    return true;
  } catch (err) {
    showAppToast("Review failed: " + err.message);
    return false;
  }
}
"""

start_pos = auth_code.find("export function submitCreatorApplication")
if start_pos != -1:
    auth_code = auth_code[:start_pos] + new_creator_fns
else:
    auth_code += "\n" + new_creator_fns

with open("public/js/auth.js", "w", encoding="utf-8") as f:
    f.write(auth_code)
print("  ✓ public/js/auth.js updated: Creator applications wired to Supabase REST")
