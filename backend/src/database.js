import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.VERCEL ? '/tmp/lumora.db' : path.join(__dirname, '..', 'lumora.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT DEFAULT '📺',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('channel', 'movie', 'series', 'anime')),
    stream_url TEXT NOT NULL,
    thumbnail TEXT,
    poster TEXT,
    year TEXT,
    rating REAL DEFAULT 0,
    duration TEXT,
    seasons INTEGER DEFAULT 1,
    episodes INTEGER DEFAULT 1,
    tags TEXT,
    featured INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
  CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
  CREATE INDEX IF NOT EXISTS idx_items_featured ON items(featured);
  CREATE INDEX IF NOT EXISTS idx_items_title ON items(title);
`);

try { db.exec("ALTER TABLE items ADD COLUMN tmdb_id INTEGER"); } catch {}
try { db.exec("ALTER TABLE items ADD COLUMN poster TEXT"); } catch {}
try { db.exec("ALTER TABLE items ADD COLUMN genres TEXT"); } catch {}
try { db.exec("ALTER TABLE items ADD COLUMN trailer TEXT"); } catch {}
try { db.exec("ALTER TABLE items ADD COLUMN cast TEXT"); } catch {}

// Add TMDB columns to movies, series, animes tables
for (const table of ['movies', 'series', 'animes']) {
  try { db.exec(`ALTER TABLE ${table} ADD COLUMN tmdb_id INTEGER`); } catch {}
  try { db.exec(`ALTER TABLE ${table} ADD COLUMN genres TEXT`); } catch {}
  try { db.exec(`ALTER TABLE ${table} ADD COLUMN trailer TEXT`); } catch {}
  try { db.exec(`ALTER TABLE ${table} ADD COLUMN cast TEXT`); } catch {}
}

export default db;
