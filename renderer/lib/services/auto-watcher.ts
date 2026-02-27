/**
 * AutoWatcher Service — Singleton
 *
 * Polls registered source folders for new audio files and runs the
 * full pipeline: Scan → Enrich → Organize (tags, covers, NFOs).
 *
 * Lifecycle:  start() ←→ stop()   |   getStatus()   |   getLogs()
 */

import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { scanDirectory } from './scanner';
import { enrichAll } from './enrichment';
import { generatePreview, executeOrganize } from './organizer';
import { batchTagWrite, batchEmbedCovers, copyCoversToAlbumFolders } from './organizer/tag-writer';
import { generateAllNfos } from './organizer/nfo-generator';

// ── Types ──

export interface WatchLog {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export interface WatchStatus {
  enabled: boolean;
  running: boolean;
  processing: boolean;
  lastRun: number | null;
  nextRun: number | null;
  intervalMinutes: number;
  logs: WatchLog[];
  lastResult: WatchResult | null;
}

export interface WatchResult {
  scanned: number;
  newTracks: number;
  enriched: number;
  organized: number;
  tagged: number;
  errors: string[];
  timestamp: number;
}

// ── Singleton ──

class AutoWatcherService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isProcessing = false;
  private lastRun: number | null = null;
  private nextRun: number | null = null;
  private intervalMinutes = 5;
  private logs: WatchLog[] = [];
  private lastResult: WatchResult | null = null;
  private maxLogs = 50;
  private restored = false;

  /**
   * Restore persisted state from DB on first access.
   * If auto_watch_enabled was 'true', restarts the watcher automatically.
   */
  restore(): void {
    if (this.restored) return;
    this.restored = true;

    try {
      const enabledRow = db
        .select()
        .from(settings)
        .where(eq(settings.key, 'auto_watch_enabled'))
        .get();
      const intervalRow = db
        .select()
        .from(settings)
        .where(eq(settings.key, 'auto_watch_interval'))
        .get();

      const wasEnabled = enabledRow?.value === 'true';
      const savedInterval = intervalRow?.value ? Number(intervalRow.value) : 5;

      if (wasEnabled && !this.intervalId) {
        this.addLog('info', 'Restoring Auto-Watch from saved settings');
        this.start(savedInterval >= 1 ? savedInterval : 5);
      }
    } catch {
      // DB not ready yet — will be restored on next getStatus() call
      this.restored = false;
    }
  }

  // ── Public API ──

  start(intervalMinutes?: number): void {
    if (this.intervalId) this.stop();

    this.intervalMinutes = intervalMinutes ?? this.intervalMinutes;
    const ms = this.intervalMinutes * 60 * 1000;

    this.addLog('info', `Auto-Watch started (every ${this.intervalMinutes} min)`);

    // Run immediately on start, then at interval
    this.runPipeline();

    this.intervalId = setInterval(() => {
      this.runPipeline();
    }, ms);

    this.nextRun = Date.now() + ms;
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.nextRun = null;
      this.addLog('info', 'Auto-Watch stopped');
    }
  }

  isEnabled(): boolean {
    return this.intervalId !== null;
  }

  getStatus(): WatchStatus {
    this.restore();
    return {
      enabled: this.intervalId !== null,
      running: this.intervalId !== null,
      processing: this.isProcessing,
      lastRun: this.lastRun,
      nextRun: this.nextRun,
      intervalMinutes: this.intervalMinutes,
      logs: [...this.logs].reverse(),
      lastResult: this.lastResult,
    };
  }

  getLogs(): WatchLog[] {
    return [...this.logs].reverse();
  }

  // ── Pipeline ──

  private async runPipeline(): Promise<void> {
    if (this.isProcessing) {
      this.addLog('warning', 'Pipeline already running, skipping');
      return;
    }

    this.isProcessing = true;
    this.lastRun = Date.now();

    const result: WatchResult = {
      scanned: 0,
      newTracks: 0,
      enriched: 0,
      organized: 0,
      tagged: 0,
      errors: [],
      timestamp: Date.now(),
    };

    try {
      // Step 1: Get library path
      const libraryPath = this.getSetting('library_path');
      if (!libraryPath) {
        this.addLog('warning', 'No library path configured — skipping');
        this.isProcessing = false;
        this.updateNextRun();
        return;
      }

      // Step 2: Scan library
      try {
        this.addLog('info', `Scanning: ${libraryPath}`);
        const scanResult = await scanDirectory(libraryPath);
        result.scanned = 1;
        result.newTracks = scanResult.newTracks;

        if (scanResult.newTracks > 0) {
          this.addLog('success', `Found ${scanResult.newTracks} new tracks`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Scan failed';
        result.errors.push(`Scan: ${msg}`);
        this.addLog('error', `Scan failed: ${msg}`);
      }

      // Step 3: Enrich metadata (if new tracks found)
      if (result.newTracks > 0) {
        try {
          this.addLog('info', 'Enriching metadata...');
          const enrichResult = await enrichAll();
          result.enriched = enrichResult.completed;

          if (enrichResult.completed > 0) {
            this.addLog('success', `Enriched ${enrichResult.completed} items`);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Enrichment failed';
          result.errors.push(`Enrich: ${msg}`);
          this.addLog('error', `Enrichment failed: ${msg}`);
        }
      }

      // Step 4: Auto-organize
      if (result.newTracks > 0) {
        try {
          this.addLog('info', 'Organizing files...');

          const preview = generatePreview();
          const readyItems = preview.items.filter((i) => !i.skip);

          if (readyItems.length > 0) {
            const operations = readyItems.map((item) => ({
              trackId: item.trackId,
              sourcePath: item.sourcePath,
              targetPath: item.targetPath,
              operation: 'move' as const,
            }));

            const execResult = executeOrganize(operations);
            result.organized = execResult.completed;

            if (execResult.completed > 0) {
              this.addLog('success', `Organized ${execResult.completed} files`);
            }

            // Tag write
            if (this.getSetting('auto_tag_write') === 'true') {
              try {
                const tagResults = batchTagWrite([]);
                result.tagged = tagResults.filter((r) => r.success).length;
                if (result.tagged > 0) {
                  this.addLog('success', `Tags written for ${result.tagged} tracks`);
                }
              } catch {
                result.errors.push('Tag write failed');
              }
            }

            // Cover embed
            if (this.getSetting('cover_embed') === 'true') {
              try {
                batchEmbedCovers([]);
                copyCoversToAlbumFolders();
              } catch {
                result.errors.push('Cover embed failed');
              }
            }

            // NFO generation
            if (this.getSetting('nfo_generate') === 'true') {
              try {
                await generateAllNfos();
              } catch {
                result.errors.push('NFO generation failed');
              }
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Organization failed';
          result.errors.push(`Organize: ${msg}`);
          this.addLog('error', `Organization failed: ${msg}`);
        }
      }

      // Summary
      if (result.newTracks > 0 || result.organized > 0) {
        this.addLog(
          'success',
          `Pipeline complete: ${result.newTracks} new, ${result.enriched} enriched, ${result.organized} organized`
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Pipeline failed';
      result.errors.push(msg);
      this.addLog('error', `Pipeline error: ${msg}`);
    } finally {
      this.lastResult = result;
      this.isProcessing = false;
      this.updateNextRun();
    }
  }

  // ── Helpers ──

  private getSetting(key: string): string | null {
    const row = db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .get();
    return row?.value ?? null;
  }

  private updateNextRun(): void {
    if (this.intervalId) {
      this.nextRun = Date.now() + this.intervalMinutes * 60 * 1000;
    }
  }

  private addLog(type: WatchLog['type'], message: string): void {
    this.logs.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      type,
      message,
    });

    // Trim old logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }
}

// Export singleton
export const autoWatcher = new AutoWatcherService();
