"""
Scraper de filmes e séries do thefilmes.net (Pobreflix)
Coleta metadados + players iframe e salva no banco do Lumora
"""
import requests
from bs4 import BeautifulSoup
import re, time, sqlite3, os, json, sys

BASE = "https://thefilmes.net"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
}
DB_PATH = r"D:\iptvlumora\backend\lumora.db"

def get_soup(url, retries=3):
    for attempt in range(retries):
        try:
            r = requests.get(url, headers=HEADERS, timeout=20)
            r.raise_for_status()
            return BeautifulSoup(r.text, "html.parser")
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2)
            else:
                print(f"    [ERROR] {url}: {e}")
                return None

def slug_from_url(url):
    return url.rstrip("/").split("/")[-1]

def discover_pages(listing_url, max_pages=50):
    """Discover all pagination pages"""
    pages = [listing_url]
    soup = get_soup(listing_url)
    if not soup:
        return pages
    
    # Find pagination links
    for a in soup.find_all("a", href=True):
        h = a["href"]
        if re.match(r".*/page/\d+/?$", h):
            full = h if h.startswith("http") else BASE + h
            if full not in pages:
                pages.append(full)
    
    # Also try sequential pages up to max_pages
    for i in range(2, max_pages + 1):
        url = f"{listing_url.rstrip('/')}/page/{i}/"
        if url not in pages:
            # Check if page has content
            s = get_soup(url)
            if s and s.find("article"):
                pages.append(url)
            else:
                break
            time.sleep(0.3)
    
    return pages

def scrape_listing_page(url):
    """Scrape a listing page and return list of item URLs"""
    soup = get_soup(url)
    if not soup:
        return [], "unknown"
    
    items = set()
    is_series = "/serie/" in url
    
    for a in soup.find_all("a", href=True):
        h = a["href"]
        pattern = r"https://thefilmes\.net/(filme|serie)/[^/]+/$"
        if re.match(pattern, h):
            slug = slug_from_url(h)
            # Skip pagination links
            if not slug.startswith("page/"):
                items.add(h)
    
    return list(items), "series" if is_series else "movies"

def scrape_movie_page(url):
    """Scrape a single movie page"""
    soup = get_soup(url)
    if not soup:
        return None
    
    slug = slug_from_url(url)
    
    # Title from h1
    h1 = soup.find("h1")
    title = ""
    year = ""
    if h1:
        full = h1.get_text(strip=True)
        title = full
        # Try to extract year from nearby
        year_span = soup.find("span", class_="date")
        if year_span:
            year = year_span.get_text(strip=True)
        ym = re.search(r"(19|20)\d{2}", full)
        if ym and not year:
            year = ym.group()
    
    # Thumbnail / poster
    thumb = ""
    og_img = soup.find("meta", property="og:image")
    if og_img:
        thumb = og_img.get("content", "")
    if not thumb:
        img = soup.find("img", {"itemprop": "image"}) or soup.find("img", class_="poster") or soup.find("img", class_="wp-post-image")
        if img:
            thumb = img.get("src", "")
    
    # Sinopse
    desc = ""
    desc_el = soup.find("div", {"itemprop": "description"}) or soup.find("div", class_="wp-content")
    if desc_el:
        # Get all paragraphs
        ps = desc_el.find_all("p")
        if ps:
            desc = " ".join(p.get_text(strip=True) for p in ps if len(p.get_text(strip=True)) > 20)[:1000]
    
    # Gêneros
    genres = []
    for a in soup.find_all("a", href=True):
        h = a["href"]
        if "/genero/" in h:
            txt = a.get_text(strip=True)
            if len(txt) > 1:
                genres.append(txt)
    genre_str = ", ".join(dict.fromkeys(genres))
    
    # Rating
    rating = 0.0
    for el in soup.find_all(string=re.compile(r"\d+\.\d+")):
        m = re.search(r"(\d+\.\d+)", str(el))
        if m:
            try:
                val = float(m.group(1))
                if 0 < val <= 10:
                    rating = val
                    break
            except:
                pass
    
    # Duration
    duration = ""
    dur_el = soup.find(string=re.compile(r"\d+\s*Min", re.I))
    if dur_el:
        m = re.search(r"(\d+)\s*Min", str(dur_el), re.I)
        if m:
            duration = f"{m.group(1)} min"
    
    # Players - extract iframe URLs + post IDs for AJAX
    players = []
    
    # Method 1: Find player option buttons with data attributes
    for li in soup.find_all("li", class_="dooplay_player_option"):
        data_post = li.get("data-post", "")
        data_nume = li.get("data-nume", "")
        data_type = li.get("data-type", "movie")
        title_el = li.find("span", class_="title")
        player_title = title_el.get_text(strip=True) if title_el else f"Player {data_nume}"
        players.append({
            "title": player_title,
            "post": data_post,
            "nume": data_nume,
            "data_type": data_type,
        })
    
    # Method 2: Also look for direct links to player pages
    for a in soup.find_all("a", href=True, target="_blank"):
        h = a["href"]
        # Known player domains
        player_domains = [
            "superflixapi", "embedplayer", "fembed", "fshd", "vsembed",
            "embed69", "kllamrd", "watchonline", "embedflix", "upcloud",
            "doodstream", "streamtape", "mixdrop"
        ]
        for domain in player_domains:
            if domain in h:
                players.append({
                    "title": f"Link {len(players)+1}",
                    "url": h,
                    "post": "",
                    "nume": "",
                    "data_type": "link",
                })
                break
    
    return {
        "slug": slug,
        "title": title,
        "year": year,
        "rating": rating,
        "thumbnail": thumb,
        "duration": duration,
        "genre": genre_str,
        "description": desc,
        "source_url": url,
        "players": json.dumps(players) if players else "",
    }

def scrape_series_page(url):
    """Scrape a series page - similar to movies but with season/episode structure"""
    data = scrape_movie_page(url)
    if not data:
        return None
    
    soup = get_soup(url)
    if not soup:
        return data
    
    # Find seasons and episodes
    episodes = []
    
    # Look for season containers
    for season_el in soup.find_all("div", class_=re.compile(r"season|temporada", re.I)):
        season_num = 1
        sm = re.search(r"(\d+)", season_el.get("class", [""])[0])
        if sm:
            season_num = int(sm.group(1))
        
        for ep_el in season_el.find_all("a", href=True):
            h = ep_el["href"]
            if "/episodio/" in h:
                episodes.append({
                    "season": season_num,
                    "url": h,
                    "slug": slug_from_url(h),
                    "label": ep_el.get_text(strip=True),
                })
    
    # Alternative: look for episode list items
    if not episodes:
        for a in soup.find_all("a", href=True):
            h = a["href"]
            ep_match = re.search(r"/episodio/([^/]+)/", h)
            if ep_match:
                episodes.append({
                    "season": 1,
                    "url": h if h.startswith("http") else BASE + h,
                    "slug": ep_match.group(1),
                    "label": a.get_text(strip=True),
                })
    
    data["episodes"] = json.dumps(episodes) if episodes else ""
    data["seasons"] = len(set(ep.get("season", 1) for ep in episodes)) if episodes else 1
    return data

def init_db():
    """Create tables for movies and series"""
    db = sqlite3.connect(DB_PATH)
    c = db.cursor()
    
    c.execute("""
        CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            year TEXT,
            rating REAL DEFAULT 0,
            thumbnail TEXT,
            duration TEXT,
            genre TEXT,
            description TEXT,
            source_url TEXT,
            players TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )""")
    
    c.execute("""
        CREATE TABLE IF NOT EXISTS series (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            year TEXT,
            rating REAL DEFAULT 0,
            thumbnail TEXT,
            duration TEXT,
            genre TEXT,
            description TEXT,
            source_url TEXT,
            players TEXT,
            seasons INTEGER DEFAULT 1,
            episodes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )""")
    
    c.execute("""
        CREATE TABLE IF NOT EXISTS series_episodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            series_id INTEGER NOT NULL,
            season INTEGER DEFAULT 1,
            episode_number INTEGER,
            slug TEXT NOT NULL,
            label TEXT,
            source_url TEXT,
            players TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (series_id) REFERENCES series(id)
        )""")
    
    db.commit()
    return db

def save_movie(db, data):
    """Save a movie to the database"""
    c = db.cursor()
    c.execute("""INSERT OR REPLACE INTO movies(slug, title, year, rating, thumbnail, duration, genre, description, source_url, players)
                 VALUES(?,?,?,?,?,?,?,?,?,?)""",
              (data["slug"], data["title"], data["year"], data["rating"],
               data["thumbnail"], data["duration"], data["genre"],
               data["description"], data["source_url"], data["players"]))
    c.execute("SELECT id FROM movies WHERE slug=?", (data["slug"],))
    row = c.fetchone()
    return row[0] if row else c.lastrowid

def save_series(db, data):
    """Save a series and its episodes to the database"""
    c = db.cursor()
    c.execute("""INSERT OR REPLACE INTO series(slug, title, year, rating, thumbnail, duration, genre, description, source_url, players, seasons, episodes)
                 VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",
              (data["slug"], data["title"], data["year"], data["rating"],
               data["thumbnail"], data["duration"], data["genre"],
               data["description"], data["source_url"], data["players"],
               data.get("seasons", 1), data.get("episodes", "")))
    c.execute("SELECT id FROM series WHERE slug=?", (data["slug"],))
    row = c.fetchone()
    series_id = row[0] if row else c.lastrowid
    
    # Save individual episodes
    if data.get("episodes"):
        try:
            eps = json.loads(data["episodes"])
            for i, ep in enumerate(eps):
                c.execute("""INSERT OR REPLACE INTO series_episodes(series_id, season, episode_number, slug, label, source_url)
                             VALUES(?,?,?,?,?,?)""",
                          (series_id, ep.get("season", 1), i+1, ep["slug"], ep.get("label", ""), ep["url"]))
        except:
            pass
    
    return series_id

def fetch_movie_players(movie_post_id):
    """
    Try to fetch player iframe URLs via the AJAX endpoint.
    This tries multiple methods.
    """
    urls = []
    
    # Method 1: Try admin-ajax.php with various actions
    actions = ["dooplayer_play", "dooplay_player", "player_ajax"]
    for action in actions:
        try:
            r = requests.post(
                f"{BASE}/wp-admin/admin-ajax.php",
                headers={**HEADERS, "Referer": f"{BASE}/filme/"},
                data={"action": action, "post": movie_post_id, "nume": "1", "type": "movie"},
                timeout=10
            )
            if r.text and r.text != "0":
                # Try to extract iframe URLs
                iframes = re.findall(r'src=["\']([^"\']+)["\']', r.text)
                for u in iframes:
                    if "superflix" in u or "embed" in u or "fembed" in u:
                        urls.append(u)
        except:
            pass
    
    return urls

def main():
    print("=" * 60)
    print("  Lumora Scraper - thefilmes.net (Filmes e Séries)")
    print("=" * 60)
    
    max_pages = 10  # Default max listing pages
    fetch_player_urls = False  # Whether to fetch AJAX player URLs (slow)
    
    for i, arg in enumerate(sys.argv):
        if arg == "--max-pages" and i + 1 < len(sys.argv):
            max_pages = int(sys.argv[i + 1])
        if arg == "--fetch-players":
            fetch_player_urls = True
    
    db = init_db()
    
    # === MOVIES ===
    print(f"\n[1/4] Coletando filmes (max {max_pages} páginas)...")
    movie_pages = discover_pages(f"{BASE}/filme/", max_pages=max_pages)
    print(f"  Encontradas {len(movie_pages)} páginas de listagem")
    
    all_movie_urls = set()
    for page_url in movie_pages:
        urls, _ = scrape_listing_page(page_url)
        all_movie_urls.update(urls)
        time.sleep(0.3)
    
    print(f"  Total de filmes únicos: {len(all_movie_urls)}")
    
    print(f"\n[2/4] Scraping detalhes dos filmes{' + players' if fetch_player_urls else ''}...")
    movie_count = 0
    for i, url in enumerate(sorted(all_movie_urls)):
        slug = slug_from_url(url)
        print(f"  [{i+1}/{len(all_movie_urls)}] {slug[:50]}...", end=" ", flush=True)
        
        data = scrape_movie_page(url)
        if data:
            movie_id = save_movie(db, data)
            
            if fetch_player_urls:
                players = json.loads(data["players"]) if data["players"] else []
                for p in players:
                    if p.get("post") and p.get("nume"):
                        urls = fetch_movie_players(p["post"])
                        if urls:
                            print(f"\n    Player URLs found: {len(urls)}")
            
            movie_count += 1
            print(f"OK | {data['title'][:40]}")
        else:
            print("SKIPPED")
        
        db.commit()
        time.sleep(0.3)
    
    # === SERIES ===
    print(f"\n[3/4] Coletando séries...")
    series_pages = discover_pages(f"{BASE}/serie/", max_pages=min(max_pages, 20))
    print(f"  Encontradas {len(series_pages)} páginas de listagem")
    
    all_series_urls = set()
    for page_url in series_pages:
        urls, _ = scrape_listing_page(page_url)
        all_series_urls.update(urls)
        time.sleep(0.3)
    
    print(f"  Total de séries únicas: {len(all_series_urls)}")
    
    print(f"\n[4/4] Scraping detalhes das séries...")
    series_count = 0
    for i, url in enumerate(sorted(all_series_urls)):
        slug = slug_from_url(url)
        print(f"  [{i+1}/{len(all_series_urls)}] {slug[:50]}...", end=" ", flush=True)
        
        data = scrape_series_page(url)
        if data:
            save_series(db, data)
            series_count += 1
            print(f"OK | {data['title'][:40]}")
        else:
            print("SKIPPED")
        
        db.commit()
        time.sleep(0.3)
    
    # Stats
    c = db.cursor()
    c.execute("SELECT COUNT(*) FROM movies")
    total_movies = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM series")
    total_series = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM series_episodes")
    total_episodes = c.fetchone()[0]
    db.close()
    
    print(f"\n{'=' * 60}")
    print(f"  DONE!")
    print(f"  Filmes salvos nesta run: {movie_count}")
    print(f"  Séries salvas nesta run: {series_count}")
    print(f"  Total no DB: {total_movies} filmes, {total_series} séries, {total_episodes} episódios")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
