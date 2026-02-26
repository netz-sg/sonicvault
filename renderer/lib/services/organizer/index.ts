import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { tracks, artists, albums, settings, fileOperations } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { buildTargetPath, type NamingContext } from './naming';
import { undoTagWrite } from './tag-writer';
import { isAudioFile } from '@/lib/utils/audio';

// ═══════════════════════════════════════════════════════
// File Organizer Service — Preview, Execute, Undo
// ═══════════════════════════════════════════════════════

// ── Types ──

export type OrganizeMode = 'copy' | 'move';
export type DuplicateStrategy = 'skip' | 'overwrite' | 'keep_both';
export type ConflictType = 'duplicate' | 'collision' | 'unresolvable';

export interface PreviewItem {
  trackId: string;
  sourcePath: string;
  targetPath: string;
  operation: OrganizeMode;
  conflict?: {
    type: ConflictType;
    reason: string;
  };
  skip: boolean;
}

export interface PreviewResult {
  items: PreviewItem[];
  totalTracks: number;
  conflicts: number;
  skipped: number;
  ready: number;
}

export interface ExecuteResult {
  completed: number;
  failed: number;
  skipped: number;
  operationIds: string[];
  errors: Array<{ trackId: string; error: string }>;
}

// ── Settings Helper ──

function getSetting(key: string): string | null {
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  return row?.value ?? null;
}

function getNamingPatterns() {
  return {
    artist: getSetting('naming_pattern_artist') || '{artist}',
    album: getSetting('naming_pattern_album') || '{year} - {album}',
    track: getSetting('naming_pattern_track') || '{track_number} - {title}',
  };
}

// ── Preview (Dry-Run) ──

/**
 * Generate a preview of all planned file operations.
 * Never modifies anything — pure read + calculation.
 */
export function generatePreview(trackIds?: string[]): PreviewResult {
  const libraryPath = getSetting('library_path');
  if (!libraryPath) {
    return { items: [], totalTracks: 0, conflicts: 0, skipped: 0, ready: 0 };
  }

  const mode = (getSetting('organize_mode') || 'copy') as OrganizeMode;
  const duplicateStrategy = (getSetting('handle_duplicates') || 'skip') as DuplicateStrategy;
  const patterns = getNamingPatterns();

  // Load tracks — either specific IDs or all with file_path
  let trackList;
  if (trackIds && trackIds.length > 0) {
    trackList = trackIds
      .map(id => db.select().from(tracks).where(eq(tracks.id, id)).get())
      .filter(Boolean) as Array<typeof tracks.$inferSelect>;
  } else {
    trackList = db.select().from(tracks)
      .where(sql`${tracks.filePath} IS NOT NULL`)
      .all();
  }

  const items: PreviewItem[] = [];
  const targetPaths = new Map<string, string>(); // targetPath -> trackId (collision detection)

  for (const track of trackList) {
    if (!track.filePath) continue;

    // Gather context for naming
    const artist = track.artistId
      ? db.select({ name: artists.name, genres: artists.genres }).from(artists).where(eq(artists.id, track.artistId)).get()
      : null;
    const album = track.albumId
      ? db.select({ title: albums.title, releaseDate: albums.releaseDate, trackCount: albums.trackCount })
          .from(albums).where(eq(albums.id, track.albumId)).get()
      : null;

    let firstGenre: string | null = null;
    if (artist?.genres) {
      try {
        const genreArr = JSON.parse(artist.genres);
        firstGenre = Array.isArray(genreArr) && genreArr.length > 0 ? genreArr[0] : null;
      } catch { /* ignore */ }
    }

    const ctx: NamingContext = {
      artist: artist?.name,
      album: album?.title,
      title: track.title,
      year: album?.releaseDate,
      trackNumber: track.trackNumber,
      discNumber: track.discNumber,
      totalTracks: album?.trackCount,
      genre: firstGenre,
      filePath: track.filePath,
    };

    const targetPath = buildTargetPath(libraryPath, patterns, ctx);

    const item: PreviewItem = {
      trackId: track.id,
      sourcePath: track.filePath,
      targetPath,
      operation: mode,
      skip: false,
    };

    // Conflict detection: unresolvable (missing metadata)
    if (!artist?.name && !album?.title) {
      item.conflict = {
        type: 'unresolvable',
        reason: 'Missing artist and album metadata',
      };
      item.skip = true;
    }

    // Conflict detection: collision (multiple tracks → same target path)
    const normalizedTarget = targetPath.toLowerCase();
    const existingTrackId = targetPaths.get(normalizedTarget);
    if (existingTrackId && existingTrackId !== track.id) {
      item.conflict = {
        type: 'collision',
        reason: `Collides with track ${existingTrackId}`,
      };
      item.skip = true;
    } else {
      targetPaths.set(normalizedTarget, track.id);
    }

    // Conflict detection: duplicate (file already exists at target)
    if (!item.conflict && fs.existsSync(targetPath)) {
      if (targetPath === track.filePath) {
        // Already at the right location
        item.skip = true;
      } else if (duplicateStrategy === 'skip') {
        item.conflict = { type: 'duplicate', reason: 'File already exists at target' };
        item.skip = true;
      } else if (duplicateStrategy === 'keep_both') {
        // Append suffix to target
        const ext = path.extname(targetPath);
        const base = targetPath.slice(0, -ext.length);
        let counter = 2;
        let newTarget = `${base} (${counter})${ext}`;
        while (fs.existsSync(newTarget)) {
          counter++;
          newTarget = `${base} (${counter})${ext}`;
        }
        item.targetPath = newTarget;
      }
      // 'overwrite' — no change needed, will overwrite on execute
    }

    items.push(item);
  }

  const conflicts = items.filter(i => i.conflict).length;
  const skipped = items.filter(i => i.skip).length;

  return {
    items,
    totalTracks: items.length,
    conflicts,
    skipped,
    ready: items.length - skipped,
  };
}

// ── Execute ──

/**
 * Execute confirmed file operations.
 * Logs every operation to file_operations BEFORE executing (for undo safety).
 */
export function executeOrganize(
  operations: Array<{ trackId: string; sourcePath: string; targetPath: string; operation: OrganizeMode }>,
): ExecuteResult {
  let completed = 0;
  let failed = 0;
  let skipped = 0;
  const operationIds: string[] = [];
  const errors: Array<{ trackId: string; error: string }> = [];

  for (const op of operations) {
    // Skip if source doesn't exist
    if (!fs.existsSync(op.sourcePath)) {
      errors.push({ trackId: op.trackId, error: 'Source file not found' });
      failed++;
      continue;
    }

    // Skip if source and target are the same
    if (path.resolve(op.sourcePath) === path.resolve(op.targetPath)) {
      skipped++;
      continue;
    }

    // Create operation log entry BEFORE executing (for undo safety)
    const opId = randomUUID();
    const now = Date.now();

    try {
      // Ensure target directory exists
      const targetDir = path.dirname(op.targetPath);
      fs.mkdirSync(targetDir, { recursive: true });

      // Log operation BEFORE execution
      db.insert(fileOperations).values({
        id: opId,
        trackId: op.trackId,
        operation: op.operation,
        sourcePath: op.sourcePath,
        targetPath: op.targetPath,
        status: 'completed',
        createdAt: now,
        updatedAt: now,
      }).run();

      // Execute the file operation
      if (op.operation === 'copy') {
        fs.copyFileSync(op.sourcePath, op.targetPath);
      } else {
        fs.renameSync(op.sourcePath, op.targetPath);
      }

      // Update track file_path in DB
      db.update(tracks)
        .set({ filePath: op.targetPath, updatedAt: now })
        .where(eq(tracks.id, op.trackId))
        .run();

      operationIds.push(opId);
      completed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      errors.push({ trackId: op.trackId, error: message });

      // Mark the operation as failed
      db.update(fileOperations)
        .set({ status: 'failed', updatedAt: Date.now() })
        .where(eq(fileOperations.id, opId))
        .run();

      failed++;
    }
  }

  // Clean up source directories after move operations
  const moveOps = operations.filter(o => o.operation === 'move');
  if (moveOps.length > 0) {
    // Group by source directory → target album directory
    const sourceDirToTargetDir = new Map<string, string>();
    for (const op of moveOps) {
      const sourceDir = path.dirname(op.sourcePath);
      const targetDir = path.dirname(op.targetPath);
      if (!sourceDirToTargetDir.has(sourceDir)) {
        sourceDirToTargetDir.set(sourceDir, targetDir);
      }
    }

    for (const [sourceDir, targetDir] of sourceDirToTargetDir) {
      try {
        if (!fs.existsSync(sourceDir)) continue;

        const remaining = fs.readdirSync(sourceDir);
        if (remaining.length === 0) {
          fs.rmdirSync(sourceDir);
          cleanEmptyDirs(path.dirname(sourceDir));
          continue;
        }

        // If audio files still remain, don't touch this directory
        const hasAudioFiles = remaining.some(f => isAudioFile(f));
        if (hasAudioFiles) continue;

        // Move remaining non-audio files (covers, logs, cue sheets, etc.) to target album dir
        for (const file of remaining) {
          const sourceFile = path.join(sourceDir, file);
          const targetFile = path.join(targetDir, file);
          try {
            const stat = fs.statSync(sourceFile);
            if (stat.isFile() && !fs.existsSync(targetFile)) {
              fs.mkdirSync(targetDir, { recursive: true });
              fs.renameSync(sourceFile, targetFile);
            } else if (stat.isFile()) {
              // Target exists already, just remove the source copy
              fs.unlinkSync(sourceFile);
            }
          } catch { /* ignore individual file errors */ }
        }

        // Remove the source directory if now empty
        const stillRemaining = fs.readdirSync(sourceDir);
        if (stillRemaining.length === 0) {
          fs.rmdirSync(sourceDir);
          cleanEmptyDirs(path.dirname(sourceDir));
        }
      } catch { /* ignore directory-level errors */ }
    }
  }

  return { completed, failed, skipped, operationIds, errors };
}

// ── Undo ──

/**
 * Undo file operations by their IDs (most recent first).
 * - Copy: delete the copied file
 * - Move: move the file back to its original location
 */
export function undoOperations(operationIds: string[]): {
  undone: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
} {
  let undone = 0;
  let failed = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const id of operationIds) {
    const op = db.select().from(fileOperations).where(eq(fileOperations.id, id)).get();
    if (!op || op.status === 'undone') continue;

    try {
      if (op.operation === 'copy' && op.targetPath) {
        // Undo copy: delete the copied file
        if (fs.existsSync(op.targetPath)) {
          fs.unlinkSync(op.targetPath);
        }
        // Restore track file_path to source
        if (op.trackId) {
          db.update(tracks)
            .set({ filePath: op.sourcePath, updatedAt: Date.now() })
            .where(eq(tracks.id, op.trackId))
            .run();
        }
      } else if (op.operation === 'move' && op.targetPath) {
        // Undo move: move file back
        if (fs.existsSync(op.targetPath)) {
          const sourceDir = path.dirname(op.sourcePath);
          fs.mkdirSync(sourceDir, { recursive: true });
          fs.renameSync(op.targetPath, op.sourcePath);
        }
        // Restore track file_path to source
        if (op.trackId) {
          db.update(tracks)
            .set({ filePath: op.sourcePath, updatedAt: Date.now() })
            .where(eq(tracks.id, op.trackId))
            .run();
        }
      } else if (op.operation === 'tag_write') {
        // Undo tag write: restore original tags from backup
        const restored = undoTagWrite(id);
        if (restored) {
          undone++;
          continue; // undoTagWrite already marks as 'undone'
        } else {
          errors.push({ id, error: 'Failed to restore original tags' });
          failed++;
          continue;
        }
      }

      // Mark as undone
      db.update(fileOperations)
        .set({ status: 'undone', updatedAt: Date.now() })
        .where(eq(fileOperations.id, id))
        .run();

      undone++;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      errors.push({ id, error: message });
      failed++;
    }
  }

  // Clean up empty directories left by undo
  for (const id of operationIds) {
    const op = db.select().from(fileOperations).where(eq(fileOperations.id, id)).get();
    if (op?.targetPath) {
      cleanEmptyDirs(path.dirname(op.targetPath));
    }
  }

  return { undone, failed, errors };
}

// ── History ──

/**
 * Fetch paginated file operation history (newest first).
 */
export function getHistory(page = 1, limit = 50) {
  const offset = (page - 1) * limit;

  const items = db.select().from(fileOperations)
    .orderBy(desc(fileOperations.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  const [{ count: total }] = db.select({ count: sql<number>`count(*)` })
    .from(fileOperations)
    .all();

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ── Helpers ──

/** Recursively remove empty directories up to a depth limit */
function cleanEmptyDirs(dirPath: string, maxDepth = 5) {
  if (maxDepth <= 0) return;
  try {
    const entries = fs.readdirSync(dirPath);
    if (entries.length === 0) {
      fs.rmdirSync(dirPath);
      cleanEmptyDirs(path.dirname(dirPath), maxDepth - 1);
    }
  } catch {
    // Ignore errors (directory may not exist, or permission issues)
  }
}
