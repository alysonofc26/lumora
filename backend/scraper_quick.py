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

def scrape_anime(url):
    soup = get_soup(url)
    if not soup:
        return None
    slug = slug_from_url(url)
    h1 = soup.find("h1")
    title = "Desconhecido"
    if h1:
        title = h1.get_text(strip=True)
        title = re.sub(r"\s+Todos os Episodios Online.*$", "", title).strip()
        title = re.sub(r"\s+Online$", "", title).strip()
    desc = ""
    desc_el = soup.find("div", itemprop="description") or soup.find("div", class_="wp-content")
    if desc_el:
        p = desc_el.find("p")
        if p:
            desc = p.get_text(strip=True)
    year = ""
    year_match = re.search(r'"datePublished".*?(\d{4})', str(soup))
    if year_match:
        year = year_match.group(1)
    rating = 0.0
    rm = re.search(r'"ratingValue":\s*"?(\d+\.d+)"?', str(soup))
    if rm:
        try:
            rating = float(rm.group(1))
        except:
            pass
    thumb = ""
    og_img = soup.find("meta", property="og:image")
    if og_img:
        thumb = og_img.get("content", "")
    genres = []
    for a in soup.find_all("a", href=True):
        h = a["href"]
        if "/genero/" in h:
            txt = a.get_text(strip=True)
            if len(txt) > 2 and txt not in ("Dublado", "Legendado") and not txt.startswith("Letra"):
                genres.append(txt)
    genre_str = ", ".join(dict.fromkeys(genres))
    ep_links = []
    seen = set()
    for a in soup.find_all("a", href=re.compile(r"/episodio/[^/]+/$")):
        ep_url = a["href"]
        if not ep_url.startswith("http"):
            ep_url = BASE + ep_url
        if ep_url not in seen:
            seen.add(ep_url)
            ep_links.append({"url": ep_url, "slug": slug_from_url(ep_url), "label": a.get_text(strip=True)})
    return {
        "slug": slug, "title": title, "description": desc,
        "year": year, "rating": rating, "thumbnail": thumb,
        "genre": genre_str, "source_url": url, "episodes": ep_links
    }

def main():
    # Read URLs from file
    url_file = os.path.join(SCRIPT_DIR, "anime_urls.txt")
    if not os.path.exists(url_file):
        print("ERROR: anime_urls.txt not found. Run the URL collector first.")
        sys.exit(1)
    with open(url_file) as f:
        urls = [line.strip() for line in f if line.strip()]
    print(f"Loaded {len(urls)} anime URLs")

    # Init DB tables
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

    total_eps = 0
    for i, url in enumerate(urls):
        slug = slug_from_url(url)
        print(f"[{i+1}/{len(urls)}] {slug[:50]}...", end=" ", flush=True)
        try:
            data = scrape_anime(url)
            if data:
                c.execute("""INSERT OR REPLACE INTO animes(slug, title, description, year, rating, thumbnail, genre, source_url)
                             VALUES(?,?,?,?,?,?,?,?)""",
                          (data["slug"], data["title"], data["description"], data["year"],
                           data["rating"], data["thumbnail"], data["genre"], data["source_url"]))
                c.execute("SELECT id FROM animes WHERE slug=?", (data["slug"],))
                row = c.fetchone()
                anime_id = row[0] if row else c.lastrowid
                for j, ep in enumerate(data["episodes"]):
                    c.execute("""INSERT OR REPLACE INTO episodes(anime_id, episode_number, slug, label, source_url, player_dublado, player_legendado)
                                 VALUES(?,?,?,?,?,?,?)""",
                              (anime_id, j+1, ep["slug"], ep["label"], ep["url"], "", ""))
                n = len(data["episodes"])
                total_eps += n
                print(f"OK | {data['title'][:40]} | {n} eps")
            else:
                print("SKIPPED")
        except Exception as e:
            print(f"ERROR: {e}")
        db.commit()
        time.sleep(0.3)

    c.execute("SELECT COUNT(*) FROM animes")
    total_animes = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM episodes")
    total_episodes = c.fetchone()[0]
    db.close()
    print(f"\nDone! {total_animes} animes, {total_episodes} episodes saved to DB")

if __name__ == "__main__":
    main()
