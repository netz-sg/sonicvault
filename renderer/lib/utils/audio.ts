import path from 'path';

// ── Supported Audio Extensions ──
const AUDIO_EXTENSIONS = new Set([
  '.mp3', '.flac', '.ogg', '.m4a', '.wav', '.aac', '.wma', '.opus',
]);

export function isAudioFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return AUDIO_EXTENSIONS.has(ext);
}

export function getAudioFormat(filePath: string): string {
  return path.extname(filePath).toLowerCase().replace('.', '');
}

// ── Filename Sanitization (OS-safe) ──
const UNSAFE_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;
const RESERVED_NAMES = new Set([
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
]);

export function sanitizeFilename(name: string, maxLength = 200): string {
  let sanitized = name
    .replace(UNSAFE_CHARS, '_')
    .replace(/\.+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Handle Windows reserved names
  const upperName = sanitized.toUpperCase().split('.')[0];
  if (RESERVED_NAMES.has(upperName)) {
    sanitized = `_${sanitized}`;
  }

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).trim();
  }

  return sanitized || 'Unknown';
}

// ── Track Number Formatting (zero-padded) ──
export function formatTrackNumber(num: number | null | undefined, totalTracks?: number): string {
  if (!num) return '00';
  const padLength = totalTracks && totalTracks >= 100 ? 3 : 2;
  return String(num).padStart(padLength, '0');
}

// ── Disc Number Formatting ──
export function formatDiscNumber(num: number | null | undefined): string {
  if (!num || num === 1) return '';
  return String(num);
}

// ── Extract year from various date formats ──
export function extractYear(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown';
  const match = dateString.match(/(\d{4})/);
  return match ? match[1] : 'Unknown';
}
