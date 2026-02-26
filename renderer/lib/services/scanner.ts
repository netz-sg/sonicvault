import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { db } from '@/lib/db';
import { artists, albums, tracks, fileOperations, sourceFolders } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { isAudioFile, getAudioFormat } from '@/lib/utils/audio';

// Type definitions for music-metadata (ESM-only, needs dynamic import)
interface IPicture {
  data: Buffer;
  format: string;
  type?: string;
}

interface AudioMetadataCommon {
  title?: string;
  artist?: string;
  albumartist?: string;
  album?: string;
  track?: { no: number | null; of: number | null };
  disk?: { no: number | null; of: number | null };
  picture?: IPicture[];
}

interface AudioMetadataFormat {
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
}

interface AudioMetadata {
  common: AudioMetadataCommon;
  format: AudioMetadataFormat;
}

interface MusicMetadataModule {
  parseFile: (path: string) => Promise<AudioMetadata>;
}

export interface ScanResult {
  totalFiles: number;
  audioFiles: number;
  newArtists: number;
  newAlbums: number;
  newTracks: number;
  skipped: number;
  errors: Array<{ file: string; error: string }>;
}

interface ParsedTrack {
  filePath: string;
  title: string;
  artistName: string;
  albumName: string;
  trackNumber: number | null;
  discNumber: number | null;
  durationMs: number | null;
  fileFormat: string;
  bitrate: number | null;
  sampleRate: number | null;
  coverData: Buffer | null;
}

// ── Main Scan Function ──
export async function scanDirectory(dirPath: string): Promise<ScanResult> {
  const result: ScanResult = {
    totalFiles: 0,
    audioFiles: 0,
    newArtists: 0,
    newAlbums: 0,
    newTracks: 0,
    skipped: 0,
    errors: [],
  };

  // Validate directory
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory does not exist: ${dirPath}`);
  }

  const stat = fs.statSync(dirPath);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${dirPath}`);
  }

  // Find all audio files
  const audioFiles = findAudioFiles(dirPath);
  result.totalFiles = audioFiles.length;
  result.audioFiles = audioFiles.length;

  // Parse each file and collect track data
  const parsedTracks: ParsedTrack[] = [];
  const mm = (await import('music-metadata')) as unknown as MusicMetadataModule;

  for (const filePath of audioFiles) {
    try {
      const metadata = await mm.parseFile(filePath);
      const common = metadata.common;
      const format = metadata.format;

      // Extract embedded cover art (prefer front cover, fallback to first picture)
      const pictures = common.picture;
      let coverData: Buffer | null = null;
      if (pictures && pictures.length > 0) {
        const frontCover = pictures.find((p) => p.type === 'Cover (front)');
        coverData = (frontCover || pictures[0]).data;
      }

      parsedTracks.push({
        filePath,
        title: common.title || path.basename(filePath, path.extname(filePath)),
        artistName: common.artist || common.albumartist || 'Unknown Artist',
        albumName: common.album || 'Unknown Album',
        trackNumber: common.track?.no ?? null,
        discNumber: common.disk?.no ?? null,
        durationMs: format.duration ? Math.round(format.duration * 1000) : null,
        fileFormat: getAudioFormat(filePath),
        bitrate: format.bitrate ? Math.round(format.bitrate) : null,
        sampleRate: format.sampleRate ?? null,
        coverData,
      });
    } catch (error) {
      result.errors.push({
        file: filePath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Artist cache: normalized name → artist ID
  const artistCache = new Map<string, string>();
  // Album cache: "artistId::albumName" → album ID
  const albumCache = new Map<string, string>();
  // Track which albums already have a cover saved (avoid re-writing per track)
  const albumCoverSaved = new Set<string>();

  const dataDir = process.env.DATA_PATH || path.resolve(process.cwd(), '..', 'data');
  const coversDir = path.join(dataDir, 'covers');

  const now = Date.now();

  for (const track of parsedTracks) {
    try {
      // ── Find or Create Artist ──
      const artistKey = track.artistName.toLowerCase().trim();
      let artistId = artistCache.get(artistKey);

      if (!artistId) {
        const existing = db
          .select({ id: artists.id })
          .from(artists)
          .where(sql`LOWER(${artists.name}) = ${artistKey}`)
          .get();

        if (existing) {
          artistId = existing.id;
        } else {
          artistId = uuid();
          db.insert(artists).values({
            id: artistId,
            name: track.artistName.trim(),
            sortName: track.artistName.trim(),
            metadataStatus: 'pending',
            createdAt: now,
            updatedAt: now,
          }).run();
          result.newArtists++;
        }
        artistCache.set(artistKey, artistId);
      }

      // ── Find or Create Album ──
      const albumKey = `${artistId}::${track.albumName.toLowerCase().trim()}`;
      let albumId = albumCache.get(albumKey);

      if (!albumId) {
        const existing = db
          .select({ id: albums.id })
          .from(albums)
          .where(
            sql`${albums.artistId} = ${artistId} AND LOWER(${albums.title}) = ${track.albumName.toLowerCase().trim()}`
          )
          .get();

        if (existing) {
          albumId = existing.id;
        } else {
          albumId = uuid();
          db.insert(albums).values({
            id: albumId,
            artistId,
            title: track.albumName.trim(),
            metadataStatus: 'pending',
            createdAt: now,
            updatedAt: now,
          }).run();
          result.newAlbums++;
        }
        albumCache.set(albumKey, albumId);
      }

      // ── Create Track (skip if file_path already exists) ──
      const existingTrack = db
        .select({ id: tracks.id })
        .from(tracks)
        .where(eq(tracks.filePath, track.filePath))
        .get();

      if (existingTrack) {
        result.skipped++;
        continue;
      }

      db.insert(tracks).values({
        id: uuid(),
        albumId,
        artistId,
        title: track.title,
        trackNumber: track.trackNumber,
        discNumber: track.discNumber,
        durationMs: track.durationMs,
        filePath: track.filePath,
        fileFormat: track.fileFormat,
        bitrate: track.bitrate,
        sampleRate: track.sampleRate,
        metadataStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      }).run();
      result.newTracks++;

      // Save embedded cover art for this album (once per album)
      if (track.coverData && albumId && !albumCoverSaved.has(albumId)) {
        try {
          // 1. Save to app cache: {DATA_PATH}/covers/{albumId}.jpg
          if (!fs.existsSync(coversDir)) {
            fs.mkdirSync(coversDir, { recursive: true });
          }
          const cachePath = path.join(coversDir, `${albumId}.jpg`);
          fs.writeFileSync(cachePath, track.coverData);

          // 2. Save as cover.jpg in the album folder (next to the audio files)
          const albumDir = path.dirname(track.filePath);
          const folderCoverPath = path.join(albumDir, 'cover.jpg');
          if (!fs.existsSync(folderCoverPath)) {
            fs.writeFileSync(folderCoverPath, track.coverData);
          }

          // 3. Set coverUrl in the database so the UI shows the cover immediately
          db.update(albums)
            .set({
              coverUrl: `/api/covers/${albumId}`,
              coverSmall: `/api/covers/${albumId}`,
              updatedAt: now,
            })
            .where(eq(albums.id, albumId))
            .run();

          albumCoverSaved.add(albumId);
        } catch {
          // Cover save failed — not critical, enrichment can still fetch it later
        }
      }
    } catch (error) {
      result.errors.push({
        file: track.filePath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Update album track counts
  for (const albumId of new Set(albumCache.values())) {
    const [countResult] = db
      .select({ count: sql<number>`count(*)` })
      .from(tracks)
      .where(eq(tracks.albumId, albumId))
      .all();

    if (countResult) {
      db.update(albums)
        .set({ trackCount: countResult.count, updatedAt: Date.now() })
        .where(eq(albums.id, albumId))
        .run();
    }
  }

  return result;
}

// ── Recursive Audio File Finder ──
function findAudioFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        // Skip hidden files/dirs
        if (entry.name.startsWith('.')) continue;

        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && isAudioFile(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch {
      // Skip directories we can't read (permission issues)
    }
  }

  walk(dir);
  return files;
}

// ── Get Library Stats ──
export function getLibraryStats() {
  const [artistCount] = db
    .select({ count: sql<number>`count(*)` })
    .from(artists)
    .all();
  const [albumCount] = db
    .select({ count: sql<number>`count(*)` })
    .from(albums)
    .all();
  const [trackCount] = db
    .select({ count: sql<number>`count(*)` })
    .from(tracks)
    .all();
  const [pendingCount] = db
    .select({ count: sql<number>`count(*)` })
    .from(tracks)
    .where(eq(tracks.metadataStatus, 'pending'))
    .all();

  // Enrichment status counts (enrichment.ts sets 'complete' or 'partial')
  const [enrichedArtists] = db
    .select({ count: sql<number>`count(*)` })
    .from(artists)
    .where(sql`${artists.metadataStatus} IN ('complete', 'partial')`)
    .all();
  const [enrichedAlbums] = db
    .select({ count: sql<number>`count(*)` })
    .from(albums)
    .where(sql`${albums.metadataStatus} IN ('complete', 'partial')`)
    .all();
  const [enrichedTracks] = db
    .select({ count: sql<number>`count(*)` })
    .from(tracks)
    .where(sql`${tracks.metadataStatus} IN ('complete', 'partial')`)
    .all();

  // Total duration
  const [totalDuration] = db
    .select({ total: sql<number>`coalesce(sum(${tracks.durationMs}), 0)` })
    .from(tracks)
    .all();

  // Source folder count
  const [folderCount] = db
    .select({ count: sql<number>`count(*)` })
    .from(sourceFolders)
    .all();

  // Recent file operations count
  const [opCount] = db
    .select({ count: sql<number>`count(*)` })
    .from(fileOperations)
    .all();

  // Recent operations (last 10)
  const recentOps = db.select().from(fileOperations)
    .orderBy(desc(fileOperations.createdAt))
    .limit(10)
    .all();

  return {
    artists: artistCount?.count ?? 0,
    albums: albumCount?.count ?? 0,
    tracks: trackCount?.count ?? 0,
    totalTracks: trackCount?.count ?? 0,
    pending: pendingCount?.count ?? 0,
    enrichedArtists: enrichedArtists?.count ?? 0,
    enrichedAlbums: enrichedAlbums?.count ?? 0,
    enrichedTracks: enrichedTracks?.count ?? 0,
    totalDurationMs: totalDuration?.total ?? 0,
    sourceFolders: folderCount?.count ?? 0,
    totalOperations: opCount?.count ?? 0,
    recentOperations: recentOps,
  };
}
