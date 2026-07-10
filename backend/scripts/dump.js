import Database from 'better-sqlite3';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '..', 'lumora.db'));

const tables = ['movies', 'series', 'animes', 'episodes', 'series_episodes'];
const data = {};

for (const t of tables) {
  const rows = db.prepare(`SELECT * FROM ${t}`).all();
  data[t] = rows;
  console.log(`${t}: ${rows.length} rows`);
}

writeFileSync(path.join(__dirname, 'scraped_data.json'), JSON.stringify(data));
console.log('Done!');
