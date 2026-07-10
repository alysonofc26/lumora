"""
Scraper do DoraMore (doramore.com)
Coleta doramas, episódios e players
"""
import requests
from bs4 import BeautifulSoup
import re, time, sqlite3, json, os

BASE = "https://doramore.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "pt-BR,pt;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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

def get_all_dorama_urls(max_pages=50):
    """Collect all dorama URLs from listing pages"""
    urls = set()
    page = 1
    while page <= max_pages:
        url = f"{BASE}/doramas" if page == 1 else f"{BASE}/doramas?page={page}"
        print(f"  Page {page}...")
        soup = get_soup(url)
        if not soup:
            break
        found = 0
        for a in soup.find_all("a", href=True):
            h = a["href"]
            if re.match(r"https://doramore\.com/dorama/[^/]+/?$", h):
                if h not in urls:
                    urls.add(h)
                    found += 1
        if found == 0:
            break
        page += 1
        time.sleep(0.5)
    print(f"  Found {len(urls)} unique doramas")
    return sorted(urls)

def scrape_dorama_page(url):
    """Scrape a dorama detail page"""
    soup = get_soup(url)
    if not soup:
        return None
    
    slug = slug_from_url(url)
    
    # Title
    title = ""
    og_title = soup.find("meta", property="og:title")
    if og_title:
        title = og_title.get("content", "").replace(" - Assistir Online Grátis | DoraMore", "").strip()
    
    # Description
    desc = ""
    og_desc = soup.find("meta", property="og:description")
    if og_desc:
        desc = og_desc.get("content", "")
    
    # Thumbnail
    thumb = ""
    og_img = soup.find("meta", property="og:image")
    if og_img:
        thumb = og_img.get("content", "")
    
    # Year
    year = ""
    # Try to find year in content
    year_match = re.search(r'"datePublished":\s*"([^"]+)"', str(soup))
    if year_match:
        year = year_match.group(1)[:4]
    
    # Genres
    genres = []
    for a in soup.find_all("a", href=True):
        h = a["href"]
        if "/genero/" in h:
            txt = a.get_text(strip=True)
            if txt:
                genres.append(txt)
    genre_str = ", ".join(dict.fromkeys(genres))
    
    # Episode links
    episodes = []
    for a in soup.find_all("a", href=True):
        h = a["href"]
        ep_match = re.match(r"https://doramore\.com/assistir/([^/]+)-(\d+)", h)
        if ep_match:
            ep_slug = ep_match.group(1)
            ep_num = int(ep_match.group(2))
            episodes.append({
                "number": ep_num,
                "slug": f"{ep_slug}-{ep_num}",
                "url": h,
                "label": a.get_text(strip=True) or f"Episódio {ep_num}",
            })
    
    # Sort episodes by number
    episodes.sort(key=lambda x: x["number"])
    
    return {
        "slug": slug,
        "title": title,
        "year": year,
        "thumbnail": thumb,
        "genre": genre_str,
        "description": desc,
        "source_url": url,
        "episodes": json.dumps(episodes),
    }

def save_dorama(db, data):
    """Save dorama to database (reuse series table)"""
    c = db.cursor()
    
    # Check if exists
    c.execute("SELECT id FROM series WHERE slug=?", (data["slug"],))
    existing = c.fetchone()
    
    if existing:
        c.execute("""UPDATE series SET title=?, year=?, thumbnail=?, genre=?, description=?, source_url=?, episodes=?
                     WHERE slug=?""",
                  (data["title"], data["year"], data["thumbnail"], data["genre"],
                   data["description"], data["source_url"], data["episodes"], data["slug"]))
        series_id = existing[0]
    else:
        c.execute("""INSERT INTO series(slug, title, year, thumbnail, genre, description, source_url, episodes, seasons)
                     VALUES(?,?,?,?,?,?,?,?,?)""",
                  (data["slug"], data["title"], data["year"], data["thumbnail"],
                   data["genre"], data["description"], data["source_url"],
                   data["episodes"], 1))
        series_id = c.lastrowid
    
    # Save individual episodes
    if data["episodes"]:
        try:
            eps = json.loads(data["episodes"])
            for ep in eps:
                c.execute("""INSERT OR REPLACE INTO series_episodes(series_id, season, episode_number, slug, label, source_url)
                             VALUES(?,?,?,?,?,?)""",
                          (series_id, 1, ep["number"], ep["slug"], ep["label"], ep["url"]))
        except:
            pass
    
    return series_id

def main():
    print("=" * 60)
    print("  Lumora Scraper - DoraMore (Doramas)")
    print("=" * 60)
    
    db = sqlite3.connect(DB_PATH)
    
    # Step 1: Get all dorama URLs
    print("\n[1/2] Coletando URLs dos doramas...")
    dorama_urls = get_all_dorama_urls(max_pages=30)
    
    # Step 2: Scrape each dorama
    print(f"\n[2/2] Scraping {len(dorama_urls)} doramas...")
    count = 0
    errors = 0
    
    for i, url in enumerate(dorama_urls):
        slug = slug_from_url(url)
        print(f"  [{i+1}/{len(dorama_urls)}] {slug[:50]}...", end=" ", flush=True)
        
        data = scrape_dorama_page(url)
        if data:
            save_dorama(db, data)
            count += 1
            eps = json.loads(data["episodes"]) if data["episodes"] else []
            print(f"OK | {data['title'][:40]} | {len(eps)} eps")
        else:
            print("SKIPPED")
            errors += 1
        
        db.commit()
        time.sleep(0.3)
    
    # Stats
    c = db.cursor()
    c.execute("SELECT COUNT(*) FROM series")
    total_series = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM series_episodes")
    total_eps = c.fetchone()[0]
    db.close()
    
    print(f"\n{'=' * 60}")
    print(f"  DONE!")
    print(f"  Doramas salvos nesta run: {count}")
    print(f"  Errors: {errors}")
    print(f"  Total series in DB: {total_series} ({total_eps} episodes)")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
