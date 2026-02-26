import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { tracks, artists, albums, fileOperations, settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { extractYear } from '@/lib/utils/audio';

// ═══════════════════════════════════════════════════════
// Tag Writer — Write metadata to audio files
// Uses node-taglib-sharp for MP3, FLAC, OGG, M4A, WMA, WAV
// ═══════════════════════════════════════════════════════

// node-taglib-sharp types (CJS module)
interface TagLibFile {
  tag: TagLibTag;
  save(): void;
  dispose(): void;
}

interface TagLibTag {
  title: string | undefined;
  performers: string[];
  album: string | undefined;
  albumArtists: string[];
  track: number;
  trackCount: number;
  disc: number;
  discCount: number;
  year: number;
  genres: string[];
  lyrics: string | undefined;
  pictures: TagLibPicture[];
}

interface TagLibPicture {
  type: number;
  mimeType: string;
  data: { toBase64String(): string };
}

interface TagLibModule {
  File: {
    createFromPath(path: string): TagLibFile;
  };
  Picture: {
    fromPath(path: string): TagLibPicture;
    fromData(data: Buffer, type: number, mimeType: string): TagLibPicture;
  };
  PictureType: {
    FrontCover: number;
  };
  ByteVector: {
    fromByteArray(data: Buffer): unknown;
  };
}

// ── Types ──

export interface TagWriteResult {
  trackId: string;
  success: boolean;
  error?: string;
}

export interface TagBackup {
  old_tags: Record<string, string | number | string[] | null>;
  new_tags: Record<string, string | number | string[] | null>;
}

interface TrackTagData {
  trackId: string;
  filePath: string;
  title: string;
  artistName: string | null;
  albumTitle: string | null;
  albumArtistName: string | null;
  trackNumber: number | null;
  trackCount: number | null;
  discNumber: number | null;
  releaseDate: string | null;
  genre: string | null;
  lyricsPlain: string | null;
  coverPath: string | null;
}

// ── Settings ──

function getSetting(key: string): string | null {
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  return row?.value ?? null;
}

// ── Load Tag Data ──

function loadTrackTagData(trackId: string): TrackTagData | null {
  const track = db.select().from(tracks).where(eq(tracks.id, trackId)).get();
  if (!track || !track.filePath) return null;

  const artist = track.artistId
    ? db.select({ name: artists.name, genres: artists.genres }).from(artists)
        .where(eq(artists.id, track.artistId)).get()
    : null;

  const album = track.albumId
    ? db.select({
        id: albums.id,
        title: albums.title,
        releaseDate: albums.releaseDate,
        trackCount: albums.trackCount,
        coverUrl: albums.coverUrl,
      }).from(albums).where(eq(albums.id, track.albumId)).get()
    : null;

  // Get first genre from artist or album
  let genre: string | null = null;
  if (artist?.genres) {
    try {
      const arr = JSON.parse(artist.genres);
      if (Array.isArray(arr) && arr.length > 0) genre = arr[0];
    } catch { /* ignore */ }
  }

  // Check for local cover file
  const dataDir = process.env.DATA_PATH || path.resolve(process.cwd(), '..', 'data');
  const coverPath = album?.id
    ? path.join(dataDir, 'covers', `${album.id}.jpg`)
    : null;
  const hasCover = coverPath && fs.existsSync(coverPath);

  return {
    trackId: track.id,
    filePath: track.filePath,
    title: track.title,
    artistName: artist?.name ?? null,
    albumTitle: album?.title ?? null,
    albumArtistName: artist?.name ?? null,
    trackNumber: track.trackNumber,
    trackCount: album?.trackCount ?? null,
    discNumber: track.discNumber,
    releaseDate: album?.releaseDate ?? null,
    genre,
    lyricsPlain: track.lyricsPlain ?? null,
    coverPath: hasCover ? coverPath : null,
  };
}

// ── Read Current Tags (for backup) ──

function readCurrentTags(taglib: TagLibModule, filePath: string): Record<string, string | number | string[] | null> {
  const file = taglib.File.createFromPath(filePath);
  try {
    const tag = file.tag;
    return {
      title: tag.title ?? null,
      performers: tag.performers?.length ? [...tag.performers] : null,
      album: tag.album ?? null,
      albumArtists: tag.albumArtists?.length ? [...tag.albumArtists] : null,
      track: tag.track || null,
      trackCount: tag.trackCount || null,
      disc: tag.disc || null,
      year: tag.year || null,
      genres: tag.genres?.length ? [...tag.genres] : null,
      lyrics: tag.lyrics ?? null,
      hasPicture: tag.pictures?.length > 0 ? 1 : null,
    };
  } finally {
    file.dispose();
  }
}

// ── Write Tags to a Single File ──

function writeTagsToFile(taglib: TagLibModule, data: TrackTagData, embedCover: boolean): void {
  const file = taglib.File.createFromPath(data.filePath);
  try {
    const tag = file.tag;

    // Write all metadata tags
    if (data.title) tag.title = data.title;
    if (data.artistName) tag.performers = [data.artistName];
    if (data.albumTitle) tag.album = data.albumTitle;
    if (data.albumArtistName) tag.albumArtists = [data.albumArtistName];
    if (data.trackNumber) tag.track = data.trackNumber;
    if (data.trackCount) tag.trackCount = data.trackCount;
    if (data.discNumber) tag.disc = data.discNumber;

    const year = extractYear(data.releaseDate);
    if (year !== 'Unknown') tag.year = parseInt(year, 10);

    if (data.genre) tag.genres = [data.genre];
    if (data.lyricsPlain) tag.lyrics = data.lyricsPlain;

    // Embed cover art if enabled and available
    if (embedCover && data.coverPath && fs.existsSync(data.coverPath)) {
      const picture = taglib.Picture.fromPath(data.coverPath);
      tag.pictures = [picture];
    }

    file.save();
  } finally {
    file.dispose();
  }
}

// ── Batch Tag Write ──

/**
 * Write metadata tags to audio files in batch.
 * Backs up original tags in file_operations for undo capability.
 */
export function batchTagWrite(trackIds: string[]): TagWriteResult[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const taglib = require('node-taglib-sharp') as TagLibModule;
  const embedCover = getSetting('cover_embed') === 'true';
  const results: TagWriteResult[] = [];

  for (const trackId of trackIds) {
    const data = loadTrackTagData(trackId);
    if (!data) {
      results.push({ trackId, success: false, error: 'Track not found or no file path' });
      continue;
    }

    if (!fs.existsSync(data.filePath)) {
      results.push({ trackId, success: false, error: 'Audio file not found' });
      continue;
    }

    try {
      // Read current tags for backup
      const oldTags = readCurrentTags(taglib, data.filePath);
      const newTags: Record<string, string | number | string[] | null> = {
        title: data.title,
        performers: data.artistName ? [data.artistName] : null,
        album: data.albumTitle,
        albumArtists: data.albumArtistName ? [data.albumArtistName] : null,
        track: data.trackNumber,
        trackCount: data.trackCount,
        disc: data.discNumber,
        year: extractYear(data.releaseDate) !== 'Unknown' ? parseInt(extractYear(data.releaseDate), 10) : null,
        genres: data.genre ? [data.genre] : null,
        lyrics: data.lyricsPlain,
      };

      const backup: TagBackup = { old_tags: oldTags, new_tags: newTags };

      // Log operation BEFORE writing (for undo safety)
      const opId = randomUUID();
      const now = Date.now();
      db.insert(fileOperations).values({
        id: opId,
        trackId,
        operation: 'tag_write',
        sourcePath: data.filePath,
        targetPath: null,
        details: JSON.stringify(backup),
        status: 'completed',
        createdAt: now,
        updatedAt: now,
      }).run();

      // Write the tags
      writeTagsToFile(taglib, data, embedCover);

      results.push({ trackId, success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to write tags';
      results.push({ trackId, success: false, error: message });
    }
  }

  return results;
}

// ── Batch Cover Embed ──

/**
 * Embed cover art into audio files in batch.
 * Only writes the PICTURE tag, does not modify other tags.
 */
export function batchEmbedCovers(trackIds: string[]): TagWriteResult[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const taglib = require('node-taglib-sharp') as TagLibModule;
  const results: TagWriteResult[] = [];

  for (const trackId of trackIds) {
    const data = loadTrackTagData(trackId);
    if (!data) {
      results.push({ trackId, success: false, error: 'Track not found or no file path' });
      continue;
    }

    if (!data.coverPath || !fs.existsSync(data.coverPath)) {
      results.push({ trackId, success: false, error: 'No cover image available' });
      continue;
    }

    if (!fs.existsSync(data.filePath)) {
      results.push({ trackId, success: false, error: 'Audio file not found' });
      continue;
    }

    try {
      // Log operation
      const opId = randomUUID();
      const now = Date.now();
      db.insert(fileOperations).values({
        id: opId,
        trackId,
        operation: 'tag_write',
        sourcePath: data.filePath,
        targetPath: null,
        details: JSON.stringify({ type: 'cover_embed', coverPath: data.coverPath }),
        status: 'completed',
        createdAt: now,
        updatedAt: now,
      }).run();

      const file = taglib.File.createFromPath(data.filePath);
      try {
        const picture = taglib.Picture.fromPath(data.coverPath);
        file.tag.pictures = [picture];
        file.save();
      } finally {
        file.dispose();
      }

      results.push({ trackId, success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to embed cover';
      results.push({ trackId, success: false, error: message });
    }
  }

  return results;
}

// ── Copy cover.jpg to Album Folders ──

/**
 * Copy cover images to album folders in the organized library.
 * Places cover.jpg next to the track files in each album directory.
 */
export function copyCoversToAlbumFolders(albumIds?: string[]): {
  copied: number;
  skipped: number;
  errors: Array<{ albumId: string; error: string }>;
} {
  let copied = 0;
  let skipped = 0;
  const errors: Array<{ albumId: string; error: string }> = [];
  const dataDir = process.env.DATA_PATH || path.resolve(process.cwd(), '..', 'data');

  // Get albums to process
  const albumList = albumIds
    ? albumIds.map(id => db.select().from(albums).where(eq(albums.id, id)).get()).filter(Boolean) as Array<typeof albums.$inferSelect>
    : db.select().from(albums).all();

  for (const album of albumList) {
    const coverSource = path.join(dataDir, 'covers', `${album.id}.jpg`);
    if (!fs.existsSync(coverSource)) {
      skipped++;
      continue;
    }

    // Find album tracks to determine their directory
    const albumTracks = db.select({ filePath: tracks.filePath })
      .from(tracks)
      .where(eq(tracks.albumId, album.id))
      .all();

    // Get the album directory from the first track that has a file path
    const firstTrackWithPath = albumTracks.find(t => t.filePath);
    if (!firstTrackWithPath?.filePath) {
      skipped++;
      continue;
    }

    const albumDir = path.dirname(firstTrackWithPath.filePath);
    const coverTarget = path.join(albumDir, 'cover.jpg');

    try {
      if (!fs.existsSync(coverTarget)) {
        fs.copyFileSync(coverSource, coverTarget);
        copied++;
      } else {
        skipped++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to copy cover';
      errors.push({ albumId: album.id, error: message });
    }
  }

  return { copied, skipped, errors };
}

// ── Undo Tag Write ──

/**
 * Restore original tags from a file_operations backup.
 * Called by the undo service when reversing a tag_write operation.
 */
export function undoTagWrite(operationId: string): boolean {
  const op = db.select().from(fileOperations).where(eq(fileOperations.id, operationId)).get();
  if (!op || op.operation !== 'tag_write' || op.status === 'undone') return false;

  if (!op.details) return false;

  try {
    const details = JSON.parse(op.details);

    // Cover-only embed — can't easily undo, just mark as undone
    if (details.type === 'cover_embed') {
      db.update(fileOperations)
        .set({ status: 'undone', updatedAt: Date.now() })
        .where(eq(fileOperations.id, operationId))
        .run();
      return true;
    }

    const backup = details as TagBackup;
    if (!backup.old_tags) return false;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const taglib = require('node-taglib-sharp') as TagLibModule;
    const file = taglib.File.createFromPath(op.sourcePath);

    try {
      const tag = file.tag;
      const old = backup.old_tags;

      // Restore each tag from backup
      tag.title = (old.title as string) ?? undefined;
      tag.performers = Array.isArray(old.performers) ? old.performers as string[] : [];
      tag.album = (old.album as string) ?? undefined;
      tag.albumArtists = Array.isArray(old.albumArtists) ? old.albumArtists as string[] : [];
      tag.track = (old.track as number) || 0;
      tag.trackCount = (old.trackCount as number) || 0;
      tag.disc = (old.disc as number) || 0;
      tag.year = (old.year as number) || 0;
      tag.genres = Array.isArray(old.genres) ? old.genres as string[] : [];
      tag.lyrics = (old.lyrics as string) ?? undefined;

      file.save();
    } finally {
      file.dispose();
    }

    db.update(fileOperations)
      .set({ status: 'undone', updatedAt: Date.now() })
      .where(eq(fileOperations.id, operationId))
      .run();

    return true;
  } catch {
    return false;
  }
}
