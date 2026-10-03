with open("run-sql.py", "r", encoding="utf-8") as f:
    lines = f.readlines()
print(f"Total lines in run-sql.py: {len(lines)}")
print("=== Lines 45 to 110 ===")
print("".join(lines[45:110]))
