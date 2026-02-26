import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = process.env.DATA_PATH || path.resolve(process.cwd(), '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const coversDir = path.join(dataDir, 'covers');
if (!fs.existsSync(coversDir)) {
  fs.mkdirSync(coversDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'sonicvault.db');
const sqlite = new Database(dbPath);

sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Read and execute migration SQL
const migrationDir = path.resolve(__dirname, 'migrations');
const migrationFiles = fs.readdirSync(migrationDir)
  .filter((f: string) => f.endsWith('.sql'))
  .sort();

for (const file of migrationFiles) {
  const sql = fs.readFileSync(path.join(migrationDir, file), 'utf-8');
  const statements = sql.split('--> statement-breakpoint');
  for (const stmt of statements) {
    const trimmed = stmt.trim();
    if (trimmed) {
      sqlite.exec(trimmed);
    }
  }
  console.log(`Applied migration: ${file}`);
}

// Insert default settings
const defaultSettings: Array<[string, string]> = [
  ['library_path', ''],
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

const insertStmt = sqlite.prepare(
  'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
);

for (const [key, value] of defaultSettings) {
  insertStmt.run(key, value);
}

console.log('Default settings initialized.');
console.log(`Database ready at: ${dbPath}`);

sqlite.close();
