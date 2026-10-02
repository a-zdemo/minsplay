print("=== 1. FULL series-data.js ===")
with open("public/js/series-data.js", "r", encoding="utf-8") as f:
    print(f.read())

print("\n=== 2. creator.js (Lines 180 to 350) ===")
with open("public/js/creator.js", "r", encoding="utf-8") as f:
    lines = f.readlines()
    print("".join(lines[180:350]))
