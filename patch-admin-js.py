with open("public/js/admin.js", "r", encoding="utf-8") as f:
    code = f.read()

# Update syncMetrics to include creator apps & user count
old_metric = 'if (issuesCountEl) issuesCountEl.textContent = flagged.toString();'
new_metric = """if (issuesCountEl) issuesCountEl.textContent = flagged.toString();
  const apps = getCreatorApplications().filter(a => a.status === "pending");
  const users = getAllRegisteredUsers();
  const cBadge = document.getElementById("count-creator-requests");
  const cMetric = document.getElementById("count-creator-requests-metric");
  const uMetric = document.getElementById("metric-total-users");
  if (cBadge) cBadge.textContent = apps.length.toString();
  if (cMetric) cMetric.textContent = apps.length.toString();
  if (uMetric) uMetric.textContent = Math.max(1, users.length).toString();"""

if old_metric in code and "count-creator-requests-metric" not in code:
    code = code.replace(old_metric, new_metric)

# Ensure promotion submission re-renders and refreshes metrics
old_promo = 'promoteUserToAdmin(email, true);\n      emailInput.value = "";\n      renderUsersRolesQueue();'
new_promo = 'promoteUserToAdmin(email, true);\n      emailInput.value = "";\n      renderUsersRolesQueue();\n      syncMetrics();'
if old_promo in code:
    code = code.replace(old_promo, new_promo)

with open("public/js/admin.js", "w", encoding="utf-8") as f:
    f.write(code)
print("  ✓ Step 3 Complete: Metrics and role queues connected in public/js/admin.js")
