"""
Fetch Blogger video tokens for all episodes in the DB.
Writes directly to backend/lumora.db with retry logic for concurrent access.
"""
import requests
from bs4 import BeautifulSoup
import sqlite3, time, os, sys

DB_PATH = r"D:\iptvlumora\backend\lumora.db"
BASE = "https://animesonlinecc.to"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

def get_soup(url):
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        r.raise_for_status()
        return BeautifulSoup(r.text, "html.parser")
    except Exception as e:
        return None

def fetch_players(ep_url):
    soup = get_soup(ep_url)
    if not soup:
        return "", ""
    dublado = ""
    legendado = ""
    opt1 = soup.find("div", id="option-1")
    if opt1:
        iframe = opt1.find("iframe")
        if iframe and iframe.get("src"):
            dublado = iframe["src"]
    opt2 = soup.find("div", id="option-2")
    if opt2:
        iframe = opt2.find("iframe")
        if iframe and iframe.get("src"):
            legendado = iframe["src"]
    return dublado, legendado

def db_retry(func, max_retries=5):
    """Retry a DB operation if locked"""
    for attempt in range(max_retries):
        try:
            return func()
        except sqlite3.OperationalError as e:
            if "locked" in str(e) and attempt < max_retries - 1:
                time.sleep(0.5 * (attempt + 1))
            else:
                raise

def main():
    db = sqlite3.connect(DB_PATH, timeout=30)
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("PRAGMA busy_timeout=5000")
    c = db.cursor()

    c.execute("SELECT id, source_url, slug FROM episodes WHERE (player_dublado = '' OR player_dublado IS NULL) AND source_url != ''")
    episodes = c.fetchall()
    total = len(episodes)
    print(f"Found {total} episodes without players")

    if total == 0:
        print("All done!")
        db.close()
        return

    updated = 0
    errors = 0

    for i, (ep_id, ep_url, ep_slug) in enumerate(episodes):
        if not ep_url.startswith("http"):
            ep_url = BASE + ep_url

        if (i + 1) % 100 == 0:
            print(f"[{i+1}/{total}] processing... ({updated} updated so far)")

        try:
            dublado, legendado = fetch_players(ep_url)
            if dublado or legendado:
                def do_update(d=dublado, l=legendado, eid=ep_id):
                    c.execute("UPDATE episodes SET player_dublado=?, player_legendado=? WHERE id=?", (d, l, eid))
                db_retry(do_update)
                updated += 1
            else:
                def do_mark(eid=ep_id):
                    c.execute("UPDATE episodes SET player_dublado='NONE' WHERE id=?", (eid,))
                db_retry(do_mark)
        except Exception as e:
            errors += 1

        if (i + 1) % 50 == 0:
            db.commit()

        time.sleep(0.5)

    db.commit()

    c.execute("SELECT COUNT(*) FROM episodes WHERE player_dublado != '' AND player_dublado != 'NONE'")
    with_players = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM episodes WHERE player_dublado = 'NONE'")
    no_players = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM episodes")
    total_eps = c.fetchone()[0]

    db.close()
    print(f"\nDone! {updated} updated this run")
    print(f"  With players: {with_players}/{total_eps}")
    print(f"  No players: {no_players}")
    print(f"  Errors: {errors}")

if __name__ == "__main__":
    main()
