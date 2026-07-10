import Database from 'better-sqlite3';
import path from 'path';
const db = new Database(path.join(__dirname, '..', 'lumora.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT NOT NULL CHECK(item_type IN ('movie', 'series', 'anime', 'iptv')),
    item_id INTEGER NOT NULL,
    title TEXT,
    thumbnail TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_type, item_id)
  )
`);

console.log('Favorites table created');
db.close();
