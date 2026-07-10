import { readFileSync, existsSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import db from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ensureTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS iptv_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT DEFAULT '📺',
      parent_id INTEGER,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS iptv_channels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tvg_id TEXT DEFAULT '',
      logo TEXT DEFAULT '',
      stream_url TEXT NOT NULL,
      group_name TEXT DEFAULT 'Geral',
      category_id INTEGER,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES iptv_categories(id)
    );
    CREATE INDEX IF NOT EXISTS idx_iptv_channels_group ON iptv_channels(group_name);
    CREATE INDEX IF NOT EXISTS idx_iptv_channels_name ON iptv_channels(name);
    CREATE INDEX IF NOT EXISTS idx_iptv_channels_active ON iptv_channels(active);
  `);
}

function parseM3UAttribute(line, attr) {
  const regex = new RegExp(`${attr}="([^"]*)"`, 'i');
  const match = line.match(regex);
  return match ? match[1] : '';
}

export function importM3UIfEmpty() {
  try {
    ensureTables();

    const count = db.prepare('SELECT COUNT(*) as c FROM iptv_channels').get().c;
    if (count > 0) {
      console.log(`IPTV: ${count} channels already loaded.`);
      return count;
    }

    const m3uPath = path.join(__dirname, '..', 'iptv_m3u.m3u');
    if (!existsSync(m3uPath)) {
      console.log('IPTV: No .m3u file found, skipping import.');
      return 0;
    }

    const fileSize = statSync(m3uPath).size;
    console.log(`IPTV: Importing from ${(fileSize / 1024 / 1024).toFixed(1)}MB M3U file...`);

    const content = readFileSync(m3uPath, 'utf-8');
    const lines = content.split('\n');

    const groupMap = {};
    let currentGroup = 'Geral';
    let imported = 0;
    let skipped = 0;

    const insertCat = db.prepare('INSERT OR IGNORE INTO iptv_categories(name, slug, sort_order) VALUES(?,?,?)');
    const insertCh = db.prepare('INSERT INTO iptv_channels(id, name, tvg_id, logo, stream_url, group_name, category_id, active) VALUES(?,?,?,?,?,?,?,?)');

    const batchSize = 5000;
    let batch = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('#EXTINF:')) {
        const name = (line.split(',').pop() || '').trim();
        const tvgId = parseM3UAttribute(line, 'tvg-id');
        const tvgName = parseM3UAttribute(line, 'tvg-name');
        const logo = parseM3UAttribute(line, 'tvg-logo');
        currentGroup = parseM3UAttribute(line, 'group-title') || 'Geral';
        const displayName = tvgName || name;

        // Next non-empty, non-comment line is the URL
        let url = '';
        for (let j = i + 1; j < lines.length; j++) {
          const next = lines[j].trim();
          if (next && !next.startsWith('#')) {
            url = next;
            break;
          }
        }

        if (!url || !displayName) {
          skipped++;
          continue;
        }

        // Track group
        if (!groupMap[currentGroup]) {
          const catResult = insertCat.run(currentGroup, currentGroup.toLowerCase().replace(/[^a-z0-9]+/g, '-'), Object.keys(groupMap).length);
          groupMap[currentGroup] = catResult.lastInsertRowid;
        }

        const id = uuidv4();
        batch.push([id, displayName, tvgId, logo, url, currentGroup, groupMap[currentGroup], 1]);
        imported++;

        if (batch.length >= batchSize) {
          const tx = db.transaction(() => {
            for (const row of batch) insertCh.run(...row);
          });
          tx();
          console.log(`IPTV: ${imported} channels imported...`);
          batch = [];
        }
      }
    }

    // Insert remaining
    if (batch.length > 0) {
      const tx = db.transaction(() => {
        for (const row of batch) insertCh.run(...row);
      });
      tx();
    }

    console.log(`IPTV: Import complete! ${imported} channels, ${skipped} skipped, ${Object.keys(groupMap).length} groups.`);
    return imported;
  } catch (e) {
    console.error('IPTV import error:', e.message);
    return 0;
  }
}

if (process.argv[1] && process.argv[1].includes('importM3U')) {
  importM3UIfEmpty();
}
