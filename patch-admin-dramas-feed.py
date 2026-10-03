with open("public/js/admin.js", "r", encoding="utf-8") as f:
    code = f.read()

# Update fetchLiveDramaCount to query public.dramas table directly
old_fetch = 'const res = await fetch(`${SUPABASE_URL}/rest/v1/r2_media_vault?select=series_id`'
new_fetch = 'const res = await fetch(`${SUPABASE_URL}/rest/v1/dramas?select=id`'

if old_fetch in code:
    code = code.replace(old_fetch, new_fetch)
    code = code.replace('const uniqueSeries = new Set(rows.map(r => r.series_id).filter(Boolean));', 'const count = rows.length;')
    code = code.replace('const count = uniqueSeries.size || DRAMA_CATALOG.length;', '')
    with open("public/js/admin.js", "w", encoding="utf-8") as f:
        f.write(code)
    print("  ✓ public/js/admin.js: Live drama metric wired to public.dramas")
else:
    print("  ✓ public/js/admin.js already queries public.dramas")
