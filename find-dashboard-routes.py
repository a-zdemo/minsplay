import os, re

print("=== CHECKING NAVIGATION LINKS TO /admin AND /creator ===")
for root, _, files in os.walk("public"):
    for fname in files:
        if fname.endswith((".html", ".js")):
            fpath = os.path.join(root, fname)
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                for idx, line in enumerate(f, 1):
                    if any(term in line for term in ['"/admin"', "'/admin'", '"/creator"', "'/creator'", 'data-route="/admin"', 'data-route="/creator"']):
                        print(f"{fpath}:{idx} -> {line.strip()[:85]}")
