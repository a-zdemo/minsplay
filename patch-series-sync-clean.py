with open("public/js/series-data.js", "r", encoding="utf-8") as f:
    code = f.read()

# Replace hardcoded the-beginning checks with dynamic formatting
old_meta = """      const title = sId === "the-dark-bees" ? "The Dark Bees" : (sId === "the-beginning" ? "The Beginning" : sId.replace(/-/g, " ").replace(/\\b\\w/g, c => c.toUpperCase()));
      const genre = sId === "the-dark-bees" ? "Urban Suspense" : "Urban Drama";
      const synopsis = sId === "the-dark-bees" ? "A high-stakes vertical suspense thriller uncovering dark underworld syndicates." : "An empire falls and a ruthless heir rises to claim the throne.";"""

new_meta = """      const title = sId === "the-dark-bees" 
        ? "The Dark Bees" 
        : sId.replace(/-/g, " ").replace(/\\b\\w/g, c => c.toUpperCase());
      const genre = sId === "the-dark-bees" ? "Urban Suspense" : "Urban Drama";
      const synopsis = sId === "the-dark-bees" 
        ? "A high-stakes vertical suspense thriller uncovering dark underworld syndicates." 
        : `${title} - Exclusive vertical drama series.`;"""

if old_meta in code:
    code = code.replace(old_meta, new_meta)
    with open("public/js/series-data.js", "w", encoding="utf-8") as f:
        f.write(code)
    print("  ✓ public/js/series-data.js updated: Hardcoded seed data removed")
else:
    print("  ✓ Metadata block already clean or pattern differed")
