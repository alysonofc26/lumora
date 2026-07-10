const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'lumora.db'));
db.pragma('journal_mode = WAL');
db.exec(`
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
  );
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
  );
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
  );
`);
console.log('Tables created successfully');
db.close();
