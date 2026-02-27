/**
 * SonicVault — Idempotent Database Migration
 * Runs on every container start. Safe to execute multiple times.
 */
const Database = require('better-sqlite3');
const { readdirSync, readFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

const dataDir = process.env.DATA_PATH || '/data';

// Ensure directories exist
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
const coversDir = join(dataDir, 'covers');
if (!existsSync(coversDir)) mkdirSync(coversDir, { recursive: true });

const dbPath = join(dataDir, 'sonicvault.db');
console.log('[migrate] Opening database:', dbPath);

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Run migration SQL files (made idempotent with IF NOT EXISTS)
const migrationDir = join(__dirname, 'migrations');

if (existsSync(migrationDir)) {
  const files = readdirSync(migrationDir)
    .filter(function (f) { return f.endsWith('.sql'); })
    .sort();

  for (const file of files) {
    let sql = readFileSync(join(migrationDir, file), 'utf-8');

    // Make idempotent: add IF NOT EXISTS to CREATE statements
    sql = sql.replace(/CREATE TABLE(?!\s+IF)/gi, 'CREATE TABLE IF NOT EXISTS');
    sql = sql.replace(/CREATE UNIQUE INDEX(?!\s+IF)/gi, 'CREATE UNIQUE INDEX IF NOT EXISTS');
    sql = sql.replace(/CREATE INDEX(?!\s+IF)/gi, 'CREATE INDEX IF NOT EXISTS');

    const statements = sql.split('--> statement-breakpoint');
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (trimmed) {
        sqlite.exec(trimmed);
      }
    }
    console.log('[migrate] Applied:', file);
  }
} else {
  console.log('[migrate] No migrations directory found at:', migrationDir);
}

// Insert default settings (OR IGNORE = skip if already exists)
const defaults = [
  ['library_path', process.env.LIBRARY_PATH || ''],
  ['naming_pattern_artist', '{artist}'],
  ['naming_pattern_album', '{year} - {album}'],
  ['naming_pattern_track', '{track_number} - {title}'],
  ['organize_mode', 'move'],
  ['auto_tag_write', 'false'],
  ['handle_duplicates', 'skip'],
  ['cover_embed', 'true'],
  ['nfo_generate', 'true'],
  ['metadata_language', 'en'],
];

const insert = sqlite.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [key, value] of defaults) {
  insert.run(key, value);
}

console.log('[migrate] Database ready at:', dbPath);
sqlite.close();
