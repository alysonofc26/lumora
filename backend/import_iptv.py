"""
Importa canais IPTV do link M3U do serviço Xtream
"""
import sqlite3, re, os

DB_PATH = r"D:\iptvlumora\backend\lumora.db"
M3U_FILE = r"D:\iptvlumora\backend\iptv_m3u.m3u"

def parse_m3u_file(filepath):
    """Parse M3U file and return list of channels"""
    channels = []
    current = {}
    
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            line = line.strip()
            if line.startswith('#EXTINF:'):
                current = {}
                # Extract tvg-id
                m = re.search(r'tvg-id="([^"]*)"', line)
                current['tvg_id'] = m.group(1) if m else ''
                # Extract tvg-name
                m = re.search(r'tvg-name="([^"]*)"', line)
                current['name'] = m.group(1) if m else ''
                # Extract tvg-logo
                m = re.search(r'tvg-logo="([^"]*)"', line)
                current['logo'] = m.group(1) if m else ''
                # Extract group-title
                m = re.search(r'group-title="([^"]*)"', line)
                current['group'] = m.group(1) if m else 'Uncategorized'
            elif line.startswith('http') and current.get('name'):
                current['url'] = line
                channels.append(current)
                current = {}
    
    return channels

def main():
    print("=" * 60)
    print("  Lumora IPTV M3U Importer")
    print("=" * 60)
    
    # Parse M3U file
    print(f"\n[1/3] Parsing M3U file: {M3U_FILE}")
    channels = parse_m3u_file(M3U_FILE)
    print(f"  Parsed {len(channels)} channels")
    
    # Init DB
    print(f"\n[2/3] Importing to database...")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Create table if not exists
    c.execute("""
        CREATE TABLE IF NOT EXISTS iptv_channels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            tvg_id TEXT,
            logo TEXT,
            group_name TEXT,
            stream_url TEXT NOT NULL,
            source TEXT DEFAULT 'xtream',
            active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Clear old xtream channels to avoid duplicates
    c.execute("DELETE FROM iptv_channels WHERE source = 'xtream'")
    
    # Insert channels in batches
    batch_size = 5000
    imported = 0
    errors = 0
    
    for i in range(0, len(channels), batch_size):
        batch = channels[i:i+batch_size]
        for ch in batch:
            try:
                c.execute("""INSERT INTO iptv_channels(name, tvg_id, logo, group_name, stream_url, source)
                             VALUES(?,?,?,?,?,?)""",
                          (ch['name'], ch.get('tvg_id', ''), ch.get('logo', ''),
                           ch.get('group', 'Uncategorized'), ch['url'], 'xtream'))
                imported += 1
            except Exception as e:
                errors += 1
        
        conn.commit()
        print(f"  Progress: {min(i+batch_size, len(channels))}/{len(channels)}")
    
    # Stats
    c.execute("SELECT COUNT(*) FROM iptv_channels WHERE source = 'xtream'")
    total_xtream = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM iptv_channels")
    total_all = c.fetchone()[0]
    c.execute("SELECT group_name, COUNT(*) as cnt FROM iptv_channels WHERE source='xtream' GROUP BY group_name ORDER BY cnt DESC LIMIT 15")
    groups = c.fetchall()
    
    conn.close()
    
    print(f"\n[3/3] Done!")
    print(f"  Imported: {imported}")
    print(f"  Errors: {errors}")
    print(f"  Total xtream channels: {total_xtream}")
    print(f"  Total channels in DB: {total_all}")
    print(f"\n  Top groups:")
    for g, cnt in groups:
        print(f"    {g}: {cnt}")

if __name__ == "__main__":
    main()
