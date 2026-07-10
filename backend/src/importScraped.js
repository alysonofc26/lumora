import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function importScrapedIfEmpty() {
  try {
    const jsonPath = path.join(__dirname, '..', 'scripts', 'scraped_data.json');
    if (!existsSync(jsonPath)) {
      console.log('SCRAPED: No scraped_data.json found, skipping.');
      return;
    }

    // Check if already imported
    const hasMovies = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='movies'").get();
    if (hasMovies) {
      const cnt = db.prepare('SELECT COUNT(*) as c FROM movies').get().c;
      if (cnt > 0) {
        console.log(`SCRAPED: ${cnt} movies already loaded.`);
        return;
      }
    }

    console.log('SCRAPED: Importing movies, series, animes...');
    const raw = readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(raw);

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT, title TEXT, year TEXT, rating REAL,
        thumbnail TEXT, duration TEXT, genre TEXT, description TEXT, source_url TEXT, players TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, tmdb_id INTEGER, genres TEXT, trailer TEXT, cast TEXT
      );
      CREATE TABLE IF NOT EXISTS series (
        id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT, title TEXT, year TEXT, rating REAL,
        thumbnail TEXT, duration TEXT, genre TEXT, description TEXT, source_url TEXT, players TEXT,
        seasons INTEGER DEFAULT 0, episodes INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        tmdb_id INTEGER, genres TEXT, trailer TEXT, cast TEXT
      );
      CREATE TABLE IF NOT EXISTS animes (
        id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT, title TEXT, description TEXT, year TEXT, rating REAL,
        thumbnail TEXT, genre TEXT, source_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        tmdb_id INTEGER, genres TEXT, trailer TEXT, cast TEXT
      );
      CREATE TABLE IF NOT EXISTS episodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT, anime_id INTEGER, episode_number INTEGER,
        slug TEXT, label TEXT, source_url TEXT, player_dublado TEXT, player_legendado TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS series_episodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT, series_id INTEGER, season INTEGER, episode_number INTEGER,
        slug TEXT, label TEXT, source_url TEXT, players TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add TMDB columns
    for (const table of ['movies', 'series', 'animes']) {
      try { db.exec(`ALTER TABLE ${table} ADD COLUMN tmdb_id INTEGER`); } catch {}
      try { db.exec(`ALTER TABLE ${table} ADD COLUMN genres TEXT`); } catch {}
      try { db.exec(`ALTER TABLE ${table} ADD COLUMN trailer TEXT`); } catch {}
      try { db.exec(`ALTER TABLE ${table} ADD COLUMN cast TEXT`); } catch {}
    }

    // Import data
    const tables = ['movies', 'series', 'animes', 'episodes', 'series_episodes'];
    for (const t of tables) {
      const rows = data[t];
      if (!rows || rows.length === 0) continue;

      const cols = Object.keys(rows[0]).filter(c => c !== 'id');
      const placeholders = cols.map(() => '?').join(',');
      const colNames = cols.join(',');
      const insert = db.prepare(`INSERT OR IGNORE INTO ${t}(${colNames}) VALUES(${placeholders})`);

      const tx = db.transaction(() => {
        for (const row of rows) {
          insert.run(...cols.map(c => row[c] ?? null));
        }
      });
      tx();
      console.log(`SCRAPED: ${rows.length} ${t} imported.`);
    }

    console.log('SCRAPED: Import complete!');
  } catch (e) {
    console.error('SCRAPED import error:', e.message);
  }
}
