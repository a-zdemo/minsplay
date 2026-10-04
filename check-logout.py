import os

print("=== 1. CHECKING SETTINGS.HTML LOGOUT BUTTON ===")
if os.path.exists("public/pages/settings.html"):
    with open("public/pages/settings.html", "r", encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            if "logout" in line.lower():
                print(f"  Line {i}: {line.strip()}")
else:
    print("  public/pages/settings.html not found")

print("\n=== 2. CHECKING SETTINGS.JS LOGOUT HANDLER ===")
if os.path.exists("public/js/settings.js"):
    with open("public/js/settings.js", "r", encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            if any(k in line.lower() for k in ["logout", "btn-db-logout", "btn-settings-logout"]):
                print(f"  Line {i}: {line.strip()}")
else:
    print("  public/js/settings.js not found")

print("\n=== 3. CHECKING AUTH.JS LOGOUT FUNCTION ===")
if os.path.exists("public/js/auth.js"):
    with open("public/js/auth.js", "r", encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            if "logout" in line.lower():
                print(f"  Line {i}: {line.strip()}")
else:
    print("  public/js/auth.js not found")
