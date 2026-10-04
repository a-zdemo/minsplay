import urllib.request
import json

SUPABASE_URL = "https://lekmsvdbthupiauejffo.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxla21zdmRidGh1cGlhdWVqZmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDY4MjEsImV4cCI6MjEwNjM4MjgyMX0.26Lu_-rQX17LKXOSJ98d2OPRYIkfW_7S-8WaMsxqqeg"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json"
}

print("=======================================================")
print("1. LIVE DRAMAS TABLE (Storefront Catalog)")
print("=======================================================")
dramas_map = {}
try:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/dramas?select=id,title,genre,episodes,status,created_at,updated_at&order=created_at.asc",
        headers=headers
    )
    with urllib.request.urlopen(req, timeout=10) as res:
        dramas = json.loads(res.read().decode())
        print(f"Total Series in 'dramas': {len(dramas)}")
        for d in dramas:
            eps = d.get("episodes") or []
            dramas_map[d.get("id")] = d
            print(f"  • [{d.get('id')}] '{d.get('title')}'")
            print(f"    - Total Episodes: {len(eps)}")
            for ep in eps:
                print(f"      ep {ep.get('id')}: {ep.get('title')} -> {ep.get('src') or ep.get('videoUrl')}")
except Exception as e:
    print(f"  ✕ Error querying dramas: {e}")

print("\n=======================================================")
print("2. LIVE R2_MEDIA_VAULT TABLE (Cloudflare Storage Ledger)")
print("=======================================================")
vault_map = {}
try:
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/r2_media_vault?select=id,series_id,title,object_key,filename,public_url,created_at&order=created_at.asc",
        headers=headers
    )
    with urllib.request.urlopen(req, timeout=10) as res:
        vault_items = json.loads(res.read().decode())
        print(f"Total Asset Rows in 'r2_media_vault': {len(vault_items)}")
        for item in vault_items:
            s_id = item.get("series_id") or "unassigned"
            if s_id not in vault_map:
                vault_map[s_id] = []
            vault_map[s_id].append(item)

        for s_id, items in vault_map.items():
            print(f"  • Series ID in vault: [{s_id}] ({len(items)} assets registered)")
            for it in items:
                print(f"      - {it.get('title') or it.get('filename')} (Key: {it.get('object_key')})")
except Exception as e:
    print(f"  ✕ Error querying r2_media_vault: {e}")

print("\n=======================================================")
print("3. SYNCHRONIZATION CONFLICT ANALYSIS")
print("=======================================================")
dramas_keys = set(dramas_map.keys())
vault_keys = set(vault_map.keys())

only_in_dramas = dramas_keys - vault_keys
only_in_vault = vault_keys - dramas_keys
in_both = dramas_keys & vault_keys

if only_in_vault:
    print(f"⚠️  RESURRECTION CANDIDATES (Exist in Vault but absent in Catalog):")
    for s in only_in_vault:
        print(f"    -> [{s}]: {len(vault_map[s])} assets will be auto-recreated if Sync Vault is run.")

if only_in_dramas:
    print(f"\n⚠️  UNREGISTERED CREATOR ASSETS (Exist in Catalog but absent in Vault Ledger):")
    for s in only_in_dramas:
        print(f"    -> [{s}]: Created via Creator Studio but missing from r2_media_vault.")

if in_both:
    print(f"\n✓  Series tracked in both tables: {in_both}")
    for s in in_both:
        d_eps = len(dramas_map[s].get("episodes") or [])
        v_eps = len(vault_map[s])
        if d_eps != v_eps:
            print(f"    ⚠️ Episode count mismatch in [{s}]: dramas has {d_eps} eps, but vault has {v_eps} assets!")

print("=======================================================")
