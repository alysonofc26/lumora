import sqlite3
conn = sqlite3.connect(r'D:\iptvlumora\backend\lumora.db')
c = conn.cursor()
c.execute('''CREATE TABLE IF NOT EXISTS movies (
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
)''')
c.execute('''CREATE TABLE IF NOT EXISTS series (
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
)''')
c.execute('''CREATE TABLE IF NOT EXISTS series_episodes (
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
)''')
conn.commit()
c.execute('SELECT name FROM sqlite_master WHERE type="table"')
print('All tables:', [r[0] for r in c.fetchall()])
conn.close()
