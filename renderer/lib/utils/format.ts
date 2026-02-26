// ── Duration Formatting ──
export function formatDuration(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatDurationLong(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return '0 min';
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
}

// ── Date Formatting ──
export function formatYear(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown';
  const year = dateString.substring(0, 4);
  return /^\d{4}$/.test(year) ? year : 'Unknown';
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

// ── Number Formatting ──
export function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

// ── File Size Formatting ──
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ── Bitrate Formatting ──
export function formatBitrate(bitrate: number | null | undefined): string {
  if (!bitrate) return 'Unknown';
  return `${Math.round(bitrate / 1000)} kbps`;
}

// ── Sample Rate Formatting ──
export function formatSampleRate(rate: number | null | undefined): string {
  if (!rate) return 'Unknown';
  return `${(rate / 1000).toFixed(1)} kHz`;
}
