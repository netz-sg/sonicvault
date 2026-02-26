import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ═══════════════════════════════════════════════════════
// SonicVault Database Schema — SQLite via Drizzle ORM
// ═══════════════════════════════════════════════════════

export const artists = sqliteTable('artists', {
  id: text('id').primaryKey(),
  mbid: text('mbid').unique(),
  name: text('name').notNull(),
  sortName: text('sort_name'),
  type: text('type'),
  country: text('country'),
  beginDate: text('begin_date'),
  endDate: text('end_date'),
  biography: text('biography'),
  imageUrl: text('image_url'),
  backgroundUrl: text('background_url'),
  genres: text('genres'),
  tags: text('tags'),
  metadataStatus: text('metadata_status').default('pending'),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
});

export const albums = sqliteTable('albums', {
  id: text('id').primaryKey(),
  mbid: text('mbid').unique(),
  releaseMbid: text('release_mbid'),
  artistId: text('artist_id').references(() => artists.id),
  title: text('title').notNull(),
  releaseDate: text('release_date'),
  type: text('type'),
  label: text('label'),
  catalogNumber: text('catalog_number'),
  country: text('country'),
  trackCount: integer('track_count'),
  coverUrl: text('cover_url'),
  coverSmall: text('cover_small'),
  genres: text('genres'),
  metadataStatus: text('metadata_status').default('pending'),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
});

export const tracks = sqliteTable('tracks', {
  id: text('id').primaryKey(),
  mbid: text('mbid'),
  albumId: text('album_id').references(() => albums.id),
  artistId: text('artist_id').references(() => artists.id),
  title: text('title').notNull(),
  trackNumber: integer('track_number'),
  discNumber: integer('disc_number').default(1),
  durationMs: integer('duration_ms'),
  filePath: text('file_path'),
  fileFormat: text('file_format'),
  bitrate: integer('bitrate'),
  sampleRate: integer('sample_rate'),
  lyricsPlain: text('lyrics_plain'),
  lyricsSynced: text('lyrics_synced'),
  acoustid: text('acoustid'),
  metadataStatus: text('metadata_status').default('pending'),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
});

export const sourceFolders = sqliteTable('source_folders', {
  id: text('id').primaryKey(),
  path: text('path').notNull().unique(),
  label: text('label'),
  autoScan: integer('auto_scan').default(0),
  autoOrganize: integer('auto_organize').default(0),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
});

export const fileOperations = sqliteTable('file_operations', {
  id: text('id').primaryKey(),
  trackId: text('track_id').references(() => tracks.id),
  operation: text('operation').notNull(),
  sourcePath: text('source_path').notNull(),
  targetPath: text('target_path'),
  details: text('details'),
  status: text('status').default('completed'),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value'),
});

// ── Type Exports ──
export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;
export type Album = typeof albums.$inferSelect;
export type NewAlbum = typeof albums.$inferInsert;
export type Track = typeof tracks.$inferSelect;
export type NewTrack = typeof tracks.$inferInsert;
export type SourceFolder = typeof sourceFolders.$inferSelect;
export type NewSourceFolder = typeof sourceFolders.$inferInsert;
export type FileOperation = typeof fileOperations.$inferSelect;
export type NewFileOperation = typeof fileOperations.$inferInsert;
export type Setting = typeof settings.$inferSelect;
