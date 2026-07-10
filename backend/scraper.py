import requests
from bs4 import BeautifulSoup
import json, re, time, sqlite3, sys, os

BASE = "https://animesonlinecc.to"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(SCRIPT_DIR, "..", "lumora.db")

def get_soup(url):
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        r.raise_for_status()
        return BeautifulSoup(r.text, "html.parser")
    except Exception as e:
        print(f"    [ERROR] {url}: {e}")
        return None

def slug_from_url(url):
    return url.rstrip("/").split("/")[-1]

def scrape_episode_players(ep_url):
    """Get Blogger video tokens from an episode page. Returns dict with dublado/legendado iframe URLs."""
    soup = get_soup(ep_url)
    if not soup:
        return {}
    players = {}
    for opt_id, key in [("option-1", "dublado"), ("option-2", "legendado")]:
        opt = soup.find("div", id=opt_id)
        if opt:
            iframe = opt.find("iframe")
            if iframe and iframe.get("src"):
                players[key] = iframe["src"]
    return players

def get_all_anime_urls(max_pages=None):
    """Collect all anime URLs from listing pages"""
    urls = set()
    page = 1
    while True:
        if max_pages and page > max_pages:
            break
        print(f"  Page {page}...")
        soup = get_soup(f"{BASE}/anime/page/{page}/")
        if not soup:
            break
        found = 0
        for a in soup.find_all("a", href=True):
            h = a["href"]
            if re.match(r"https://animesonlinecc\.to/anime/[^/]+/$", h) and h != BASE + "/anime/":
                if h not in urls:
                    urls.add(h)
                    found += 1
        if found == 0:
            break
        page += 1
        time.sleep(0.3)
    print(f"  Found {len(urls)} unique animes")
    return sorted(urls)

def scrape_anime(url):
    """Scrape one anime page for metadata + episode links"""
    soup = get_soup(url)
    if not soup:
        return None

    slug = slug_from_url(url)

    # Title: strip common suffixes
    h1 = soup.find("h1")
    title = "Desconhecido"
    if h1:
        title = h1.get_text(strip=True)
        title = re.sub(r"\s+Todos os Episodios Online.*$", "", title).strip()
        title = re.sub(r"\s+Online$", "", title).strip()

    # Description
    desc = ""
    desc_el = soup.find("div", itemprop="description") or soup.find("div", class_="wp-content")
    if desc_el:
        p = desc_el.find("p")
        if p:
            desc = p.get_text(strip=True)

    # Year from schema.org or content
    year = ""
    year_match = re.search(r'"datePublished".*?(\d{4})', str(soup))
    if year_match:
        year = year_match.group(1)

    # Rating from schema.org aggregateRating
    rating = 0.0
    rm = re.search(r'"ratingValue":\s*"?(\d+\.d+)"?', str(soup))
    if rm:
        try:
            rating = float(rm.group(1))
        except:
            pass

    # Thumbnail
    thumb = ""
    og_img = soup.find("meta", property="og:image")
    if og_img:
        thumb = og_img.get("content", "")

    # Genres (skip single letters and "Letra X")
    genres = []
    genre_blacklist = set("abcdefghijklmnopqrstuvwxyz")
    for a in soup.find_all("a", href=True):
        h = a["href"]
        if "/genero/" in h:
            txt = a.get_text(strip=True)
            if len(txt) > 2 and txt not in ("Dublado", "Legendado") and not txt.startswith("Letra"):
                genres.append(txt)
    genre_str = ", ".join(dict.fromkeys(genres))

    # Episode links (all /episodio/ links on this page)
    ep_links = []
    seen = set()
    for a in soup.find_all("a", href=re.compile(r"/episodio/[^/]+/$")):
        ep_url = a["href"]
        if not ep_url.startswith("http"):
            ep_url = BASE + ep_url
        if ep_url not in seen:
            seen.add(ep_url)
            ep_links.append({
                "url": ep_url,
                "slug": slug_from_url(ep_url),
                "label": a.get_text(strip=True)
            })

    return {
        "slug": slug,
        "title": title,
        "description": desc,
        "year": year,
        "rating": rating,
        "thumbnail": thumb,
        "genre": genre_str,
        "source_url": url,
        "episodes": ep_links
    }

def save_anime_and_episodes(db, anime_data, fetch_players=False):
    """Save anime and its episodes to the database"""
    c = db.cursor()

    c.execute("""INSERT OR REPLACE INTO animes(slug, title, description, year, rating, thumbnail, genre, source_url)
                 VALUES(?,?,?,?,?,?,?,?)""",
              (anime_data["slug"], anime_data["title"], anime_data["description"],
               anime_data["year"], anime_data["rating"], anime_data["thumbnail"],
               anime_data["genre"], anime_data["source_url"]))

    c.execute("SELECT id FROM animes WHERE slug=?", (anime_data["slug"],))
    row = c.fetchone()
    anime_id = row[0] if row else c.lastrowid

    for i, ep in enumerate(anime_data["episodes"]):
        player_dublado = ""
        player_legendado = ""
        if fetch_players:
            players = scrape_episode_players(ep["url"])
            player_dublado = players.get("dublado", "")
            player_legendado = players.get("legendado", "")
            time.sleep(0.2)

        c.execute("""INSERT OR REPLACE INTO episodes(anime_id, episode_number, slug, label, source_url, player_dublado, player_legendado)
                     VALUES(?,?,?,?,?,?,?)""",
                  (anime_id, i + 1, ep["slug"], ep["label"], ep["url"],
                   player_dublado, player_legendado))

    return len(anime_data["episodes"])

def init_db():
    """Add tables for scraped animes/episodes"""
    db = sqlite3.connect(DB_PATH)
    c = db.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS animes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            year TEXT,
            rating REAL DEFAULT 0,
            thumbnail TEXT,
            genre TEXT,
            source_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )""")

    c.execute("""
        CREATE TABLE IF NOT EXISTS episodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            anime_id INTEGER NOT NULL,
            episode_number INTEGER,
            slug TEXT NOT NULL,
            label TEXT,
            source_url TEXT,
            player_dublado TEXT,
            player_legendado TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (anime_id) REFERENCES animes(id)
        )""")

    db.commit()
    return db

def main():
    print("=" * 60)
    print("  IPTV Lumora - Anime Scraper")
    print("  Source: animesonlinecc.to")
    print("=" * 60)

    # Parse args
    max_anime_pages = None  # None = all
    limit_animes = None      # None = all
    fetch_players = False

    for i, arg in enumerate(sys.argv):
        if arg == "--pages" and i + 1 < len(sys.argv):
            max_anime_pages = int(sys.argv[i + 1])
        if arg == "--limit" and i + 1 < len(sys.argv):
            limit_animes = int(sys.argv[i + 1])
        if arg == "--with-players":
            fetch_players = True

    # Init DB
    db = init_db()

    # Step 1: Get anime URLs
    print(f"\n[1/3] Collecting anime URLs{' (max ' + str(max_anime_pages) + ' pages)' if max_anime_pages else ''}...")
    anime_urls = get_all_anime_urls(max_pages=max_anime_pages)

    if limit_animes:
        anime_urls = anime_urls[:limit_animes]

    print(f"  Will scrape {len(anime_urls)} animes")

    # Step 2: Scrape each anime
    print(f"\n[2/3] Scraping anime pages{' with player tokens' if fetch_players else ''}...")
    total_eps = 0
    errors = 0

    for i, url in enumerate(anime_urls):
        slug = slug_from_url(url)
        print(f"  [{i+1}/{len(anime_urls)}] {slug[:50]}...", end=" ", flush=True)

        try:
            data = scrape_anime(url)
            if data:
                n = save_anime_and_episodes(db, data, fetch_players=fetch_players)
                total_eps += n
                print(f"OK | {data['title'][:40]} | {n} eps")
            else:
                print("SKIPPED (no data)")
                errors += 1
        except Exception as e:
            print(f"ERROR: {e}")
            errors += 1

        time.sleep(0.2)

    db.commit()

    # Stats
    c = db.cursor()
    c.execute("SELECT COUNT(*) FROM animes")
    total_animes = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM episodes")
    total_episodes = c.fetchone()[0]
    db.close()

    print(f"\n[3/3] Done!")
    print(f"  Total animes in DB: {total_animes}")
    print(f"  Total episodes in DB: {total_episodes}")
    print(f"  Errors: {errors}")
    print("=" * 60)

if __name__ == "__main__":
    main()
