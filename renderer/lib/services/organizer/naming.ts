import path from 'path';
import { sanitizeFilename, formatTrackNumber, extractYear, getAudioFormat } from '@/lib/utils/audio';

// ═══════════════════════════════════════════════════════
// Naming Pattern Engine — Template Variable Replacement
// ═══════════════════════════════════════════════════════

export interface NamingContext {
  artist: string | null | undefined;
  album: string | null | undefined;
  title: string;
  year: string | null | undefined;
  trackNumber: number | null | undefined;
  discNumber: number | null | undefined;
  totalTracks?: number | null;
  genre: string | null | undefined;
  filePath: string;
}

/** All supported template variables */
const TEMPLATE_VARS: Record<string, (ctx: NamingContext) => string> = {
  artist:       (ctx) => ctx.artist || 'Unknown Artist',
  album:        (ctx) => ctx.album || 'Unknown Album',
  title:        (ctx) => ctx.title || 'Unknown Track',
  year:         (ctx) => { const y = extractYear(ctx.year); return y === 'Unknown' ? '' : y; },
  track_number: (ctx) => formatTrackNumber(ctx.trackNumber, ctx.totalTracks ?? undefined),
  disc_number:  (ctx) => String(ctx.discNumber || 1),
  genre:        (ctx) => ctx.genre || 'Unknown',
  format:       (ctx) => getAudioFormat(ctx.filePath),
};

/**
 * Replace {variable} placeholders in a naming pattern with actual values.
 * Each segment is sanitized for filesystem safety.
 * Empty variables are gracefully removed along with their surrounding separators.
 */
export function applyPattern(pattern: string, ctx: NamingContext): string {
  let result = pattern.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const resolver = TEMPLATE_VARS[key];
    if (!resolver) return `{${key}}`;
    const value = resolver(ctx);
    if (!value) return '';
    return sanitizeFilename(value);
  });

  // Clean up dangling separators from empty variables (e.g. " - Album" → "Album")
  result = result
    .replace(/^\s*[-–—]\s+/, '')
    .replace(/\s+[-–—]\s*$/, '')
    .replace(/\s*[-–—]\s+[-–—]\s*/g, ' - ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return result || 'Unknown';
}

/**
 * Build the full target path for a track based on naming patterns.
 *
 * Result: <libraryPath>/<artistPattern>/<albumPattern>/<trackPattern>.<ext>
 */
export function buildTargetPath(
  libraryPath: string,
  patterns: {
    artist: string;
    album: string;
    track: string;
  },
  ctx: NamingContext,
): string {
  const artistDir = applyPattern(patterns.artist, ctx);
  const albumDir = applyPattern(patterns.album, ctx);
  const trackName = applyPattern(patterns.track, ctx);
  const ext = path.extname(ctx.filePath);

  return path.join(libraryPath, artistDir, albumDir, `${trackName}${ext}`);
}

/**
 * Parse a naming pattern and return the list of template variables used.
 * Useful for validation and UI display.
 */
export function getPatternVariables(pattern: string): string[] {
  const matches = pattern.matchAll(/\{(\w+)\}/g);
  return [...matches].map(m => m[1]);
}

/**
 * Validate a naming pattern — check that all variables are recognized.
 */
export function validatePattern(pattern: string): { valid: boolean; unknown: string[] } {
  const vars = getPatternVariables(pattern);
  const unknown = vars.filter(v => !(v in TEMPLATE_VARS));
  return { valid: unknown.length === 0, unknown };
}
