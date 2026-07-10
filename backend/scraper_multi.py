"""
Multi-source scraper - Adiciona conteudo de varios sites gratuitos
Fontes suportadas:
- thefilmes.net (Pobreflix) - filmes e series
- animesonlinecc.to - animes
- popcornmovies.net - filmes
- vizer.tv - filmes e series (se disponivel)
"""
import requests
from bs4 import BeautifulSoup
import re, time, sqlite3, json, sys

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "pt-BR,pt;q=0.9",
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
                return None

def save_movie_if_new(db, data):
    """Save movie only if not already in DB by slug or title+year"""
    c = db.cursor()
    # Check by slug
    c.execute("SELECT id FROM movies WHERE slug=?", (data["slug"],))
    if c.fetchone():
        c.execute("""UPDATE movies SET title=?, year=?, rating=?, thumbnail=?, duration=?,
                     genre=?, description=?, source_url=?, players=? WHERE slug=?""",
                  (data["title"], data["year"], data["rating"], data["thumbnail"],
                   data["duration"], data["genre"], data["description"],
                   data["source_url"], data["players"], data["slug"]))
        db.commit()
        return "updated"
    # Check by title+year similar
    c.execute("SELECT id FROM movies WHERE title LIKE ? AND year=?", (f"%{data['title'][:30]}%", data["year"]))
    if c.fetchone():
        return "duplicate"
    c.execute("""INSERT INTO movies(slug,title,year,rating,thumbnail,duration,genre,description,source_url,players)
                 VALUES(?,?,?,?,?,?,?,?,?,?)""",
              (data["slug"], data["title"], data["year"], data["rating"],
               data["thumbnail"], data["duration"], data["genre"],
               data["description"], data["source_url"], data["players"]))
    db.commit()
    return "inserted"

def scrape_themoviesdb():
    """Scrape from themoviesdb.org - filme metadata + links"""
    BASE = "https://www.themoviesdb.org"
    print("\n  [Source: themoviesdb.org]")
    # This site has movie pages with embed links
    # Structure: /movie/{slug}
    soup = get_soup(f"{BASE}/latest-movies")
    if not soup:
        print("    Failed to load")
        return []
    movies = []
    for a in soup.find_all("a", href=re.compile(r"/movie/[^/]+/?$")):
        movies.append({"url": BASE + a["href"] if not a["href"].startswith("http") else a["href"]})
    print(f"    Found {len(movies)} movie links")
    return movies

def scrape_gdrivemovies():
    """Scrape from gdrivemovies.com - filmes com links Google Drive/embed"""
    BASE = "https://www.gdrivemovies.com"
    print("\n  [Source: gdrivemovies.com]")
    soup = get_soup(f"{BASE}/movies")
    if not soup:
        print("  Failed to load")
        return []
    movies = []
    for a in soup.find_all("a", href=True):
        h = a["href"]
        if "/movies/" in h or "/filmes/" in h or "/series/" in h:
            url = h if h.startswith("http") else BASE + h
            if url not in [m["url"] for m in movies]:
                movies.append({"url": url})
    print(f"    Found {len(movies)} links")
    return movies

def scrape_comandofilmes():
    """Scrape from comandofilmes.net"""
    BASE = "https://www.comandofilmes.net"
    print("\n  [Source: comandofilmes.net]")
    soup = get_soup(f"{BASE}/filmes/")
    if not soup:
        print("    Failed to load")
        return []
    movies = []
    for a in soup.find_all("a", href=True):
        h = a["href"]
        if "/filme/" in h and not h.endswith("/filmes/"):
            url = h if h.startswith("http") else BASE + h
            if url not in [m["url"] for m in movies]:
                movies.append({"url": url})
    print(f"    Found {len(movies)} links")
    return movies

# ===== SCRIPT PRINCIPAL =====
def main():
    print("=" * 60)
    print("  Lumora Multi-Source Scraper")
    print("=" * 60)
    
    db = sqlite3.connect(DB_PATH)
    
    sources = [
        ("themoviesdb", scrape_themoviesdb),
        ("gdrivemovies", scrape_gdrivemovies),
        ("comandofilmes", scrape_comandofilmes),
    ]
    
    total_inserted = 0
    total_updated = 0
    total_dupes = 0
    
    for source_name, scrape_fn in sources:
        try:
            urls = scrape_fn()
            for url_data in urls[:20]:  # Limit per source for now
                # TODO: Scrape individual movie page
                # For now, just count discovered URLs
                pass
            print(f"  {source_name}: {len(urls)} URLs discovered")
        except Exception as e:
            print(f"  {source_name}: ERROR - {e}")
    
    # Get final stats
    c = db.cursor()
    c.execute("SELECT COUNT(*) FROM movies")
    movies_count = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM series")
    series_count = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM animes")
    animes_count = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM episodes WHERE anime_id IS NOT NULL")
    anime_eps = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM series_episodes")
    series_eps = c.fetchone()[0]
    
    db.close()
    
    print(f"\n{'=' * 60}")
    print(f"  DATABASE STATS:")
    print(f"  Movies: {movies_count}")
    print(f"  Series: {series_count} ({series_eps} episodes)")
    print(f"  Animes: {animes_count} ({anime_eps} episodes)")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
