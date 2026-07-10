"""
Parser M3U - Importa canais IPTV de playlists M3U gratuitas
Fonte: https://iptv-org.github.io/iptv/
"""
import requests
import re, sqlite3, os

DB_PATH = r"D:\iptvlumora\backend\lumora.db"

# Playlists M3U gratuitas do iptv-org
M3U_SOURCES = {
    "brazil": "https://iptv-org.github.io/iptv/countries/br.m3u",
    "world": "https://iptv-org.github.io/iptv/index.m3u",
    "sports": "https://iptv-org.github.io/iptv/categories/sports.m3u",
    "news": "https://iptv-org.github.io/iptv/categories/news.m3u",
    "movies": "https://iptv-org.github.io/iptv/categories/movies.m3u",
    "entertainment": "https://iptv-org.github.io/iptv/categories/entertainment.m3u",
    "kids": "https://iptv-org.github.io/iptv/categories/kids.m3u",
}

def parse_m3u(content):
    """Parse M3U content and return list of channels"""
    channels = []
    lines = content.strip().split('\n')
    current = {}
    
    for line in lines:
        line = line.strip()
        if line.startswith('#EXTINF:'):
            # Parse channel info
            current = {}
            # Extract tvg-id
            m = re.search(r'tvg-id="([^"]*)"', line)
            current['tvg_id'] = m.group(1) if m else ''
            # Extract tvg-logo
            m = re.search(r'tvg-logo="([^"]*)"', line)
            current['logo'] = m.group(1) if m else ''
            # Extract group-title
            m = re.search(r'group-title="([^"]*)"', line)
            current['group'] = m.group(1) if m else 'Uncategorized'
            # Extract channel name (after last comma)
            parts = line.rsplit(',', 1)
            if len(parts) > 1:
                current['name'] = parts[-1].strip()
            else:
                current['name'] = ''
        elif line.startswith('http') and current.get('name'):
            current['url'] = line
            channels.append(current)
            current = {}
    
    return channels

def init_db():
    """Create iptv_channels table"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS iptv_channels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            tvg_id TEXT,
            logo TEXT,
            group_name TEXT,
            stream_url TEXT NOT NULL,
            source TEXT,
            active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    c.execute("CREATE INDEX IF NOT EXISTS idx_iptv_group ON iptv_channels(group_name)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_iptv_name ON iptv_channels(name)")
    conn.commit()
    return conn

def main():
    print("=" * 60)
    print("  Lumora M3U Parser - IPTV Channels")
    print("=" * 60)
    
    conn = init_db()
    c = conn.cursor()
    
    total_imported = 0
    total_skipped = 0
    
    for source_name, url in M3U_SOURCES.items():
        print(f"\n[Source: {source_name}] {url}")
        try:
            r = requests.get(url, timeout=30)
            r.raise_for_status()
            channels = parse_m3u(r.text)
            print(f"  Parsed {len(channels)} channels")
            
            imported = 0
            skipped = 0
            for ch in channels:
                # Skip if URL already exists
                c.execute("SELECT id FROM iptv_channels WHERE stream_url=?", (ch['url'],))
                if c.fetchone():
                    skipped += 1
                    continue
                c.execute("""INSERT INTO iptv_channels(name, tvg_id, logo, group_name, stream_url, source)
                             VALUES(?,?,?,?,?,?)""",
                          (ch['name'], ch.get('tvg_id', ''), ch.get('logo', ''),
                           ch.get('group', 'Uncategorized'), ch['url'], source_name))
                imported += 1
            
            conn.commit()
            total_imported += imported
            total_skipped += skipped
            print(f"  Imported: {imported}, Skipped (duplicates): {skipped}")
        except Exception as e:
            print(f"  ERROR: {e}")
    
    # Stats
    c.execute("SELECT COUNT(*) FROM iptv_channels")
    total = c.fetchone()[0]
    c.execute("SELECT group_name, COUNT(*) as cnt FROM iptv_channels GROUP BY group_name ORDER BY cnt DESC LIMIT 10")
    groups = c.fetchall()
    
    conn.close()
    
    print(f"\n{'=' * 60}")
    print(f"  DONE!")
    print(f"  Total imported: {total_imported}")
    print(f"  Total skipped: {total_skipped}")
    print(f"  Total channels in DB: {total}")
    print(f"\n  Top groups:")
    for g, cnt in groups:
        print(f"    {g}: {cnt}")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
