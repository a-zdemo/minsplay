with open("public/js/router.js", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add imports for privacyHtml and deletionHtml
import_target = 'import creatorHtml from "../pages/creator.html?raw";'
imports_add = """import creatorHtml from "../pages/creator.html?raw";
import privacyHtml from "../pages/privacy.html?raw";
import deletionHtml from "../pages/deletion.html?raw";"""

if "privacyHtml" not in code and import_target in code:
    code = code.replace(import_target, imports_add)

# 2. Add /privacy and /deletion to route table
route_target = '  "/admin": adminHtml,\n  "/auth": authHtml,'
routes_add = """  "/admin": adminHtml,
  "/auth": authHtml,
  "/privacy": privacyHtml,
  "/deletion": deletionHtml,"""

if '"/privacy": privacyHtml' not in code and route_target in code:
    code = code.replace(route_target, routes_add)

# 3. Add to isSubpage list so bottom nav hides cleanly
subpage_target = 'path === "/creator" || path === "/auth" || path === "/admin"'
subpage_add = 'path === "/creator" || path === "/auth" || path === "/admin" || path === "/privacy" || path === "/deletion"'

if 'path === "/privacy"' not in code and subpage_target in code:
    code = code.replace(subpage_target, subpage_add)

# 4. Handle Deletion purge action button
deletion_handler = """  if (path === "/deletion") {
    const purgeBtn = document.getElementById("btn-request-data-deletion");
    if (purgeBtn) {
      purgeBtn.onclick = () => {
        if (confirm("Are you sure you want to request data deletion? Your local session will be logged out.")) {
          localStorage.removeItem("minsplay_auth_session_v1");
          localStorage.removeItem("minsplay_watch_progress");
          showAppToast("Deletion request submitted 🗑️. Logged out.");
          setTimeout(() => navigateTo("/"), 1200);
        }
      };
    }
  }"""

if 'if (path === "/deletion")' not in code:
    code = code.replace('initAdminDashboard();\n  }', 'initAdminDashboard();\n  }\n' + deletion_handler)

with open("public/js/router.js", "w", encoding="utf-8") as f:
    f.write(code)
print("  ✓ public/js/router.js: /privacy & /deletion routes registered and wired")
