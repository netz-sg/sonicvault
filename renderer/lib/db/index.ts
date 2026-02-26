import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

export function getDataDir(): string {
  if (process.env.DATA_PATH) {
    return path.resolve(process.env.DATA_PATH);
  }
  // Default: <project-root>/data (renderer runs from renderer/, so go up one level)
  return path.resolve(process.cwd(), '..', 'data');
}

function initializeDatabase(): ReturnType<typeof drizzle> {
  const dataDir = getDataDir();
  console.log('[DB] Data directory:', dataDir, '| DATA_PATH env:', process.env.DATA_PATH || '(not set)', '| cwd:', process.cwd());

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Ensure covers directory exists
  const coversDir = path.join(dataDir, 'covers');
  if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'sonicvault.db');
  const sqlite = new Database(dbPath);

  // Enable WAL mode for better concurrent access
  sqlite.pragma('journal_mode = WAL');
  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON');

  return drizzle(sqlite, { schema });
}

// Singleton database instance
let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = initializeDatabase();
  }
  return dbInstance;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const instance = getDb();
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return (value as Function).bind(instance);
    }
    return value;
  },
});
