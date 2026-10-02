with open("public/js/tasks-api.js", "r", encoding="utf-8") as f:
    print("=== tasks-api.js ===")
    print(f.read()[:800])

with open("public/js/router.js", "r", encoding="utf-8") as f:
    lines = f.readlines()
    print("\n=== router.js Profile & Member Handlers ===")
    for i, l in enumerate(lines):
        if any(w in l for w in ['path === "/profile"', 'path === "/member"', 'initPlayer']):
            print(f"L{i+1}: {l.strip()}")
