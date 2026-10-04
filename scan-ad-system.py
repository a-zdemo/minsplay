import os, re

print("=======================================================")
print("MINSPLAY ADVERTISING & MONETIZATION SCAN")
print("=======================================================")

ad_patterns = [
    r'admob', r'rewarded-ad', r'btn-unlock-mock', r'triggerRewardedAd',
    r'task_ad', r'banner-ad', r'google-ads', r'ca-app-pub'
]

matches = []
for root, _, files in os.walk("public"):
    for fname in files:
        if fname.endswith((".js", ".html", ".css")):
            fpath = os.path.join(root, fname)
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                for idx, line in enumerate(f, 1):
                    for pat in ad_patterns:
                        if re.search(pat, line, re.IGNORECASE):
                            matches.append((fpath, idx, line.strip()))
                            break

print(f"Total Ad-Related Code Anchors Found: {len(matches)}\n")
for fpath, idx, line in matches[:35]:
    print(f"  • {fpath}:{idx} -> {line[:80]}")

print("=======================================================")
