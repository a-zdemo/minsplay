import os

print("=== 1. SETTINGS.JS CONTENT ===")
if os.path.exists("public/js/settings.js"):
    with open("public/js/settings.js", "r", encoding="utf-8") as f:
        print(f.read())

print("\n=== 2. AUTH.JS LOGOUT SECTION ===")
if os.path.exists("public/js/auth.js"):
    with open("public/js/auth.js", "r", encoding="utf-8") as f:
        lines = f.readlines()
        for i, line in enumerate(lines, 1):
            if "logout" in line.lower() or (140 <= i <= 165):
                print(f"L{i}: {line.rstrip()}")
