import os

def show(path, max_l=160):
    print(f"\n{'='*25} {path} {'='*25}")
    if not os.path.exists(path):
        print("STATUS: File does not exist")
        return
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
    print(f"Total lines: {len(lines)}")
    print("".join(lines[:max_l]))
    if len(lines) > max_l:
        print(f"... [Truncated remaining {len(lines) - max_l} lines] ...")

# 1. Edge Function handling Cloudflare/R2
show("supabase/functions/smart-responder/index.ts", 200)

# 2. Frontend video fetchers
show("public/js/foryou.js", 80)
show("public/pages/home.js", 60)
show("public/js/series-data.js", 60)
