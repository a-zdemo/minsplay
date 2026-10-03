with open("public/pages/watch.html", "r", encoding="utf-8") as f:
    h = f.read()

# Remove the duplicate drawer markup from watch.html so comments.js manages the single master drawer
if "<!-- Live Episodic Comments Drawer Sheet -->" in h:
    start_pos = h.find("  <!-- Live Episodic Comments Drawer Sheet -->")
    end_pos = h.find("</section>", start_pos)
    h = h[:start_pos] + "</section>\n"
    with open("public/pages/watch.html", "w", encoding="utf-8") as f:
        f.write(h)
    print("  ✓ Removed duplicate drawer from watch.html (single master drawer active)")
else:
    print("  ✓ watch.html clean")
