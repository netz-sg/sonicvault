import { requestQueue } from '@/lib/services/request-queue';

const BASE_URL = 'https://lrclib.net/api';

interface LRCLibResponse {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

export interface LyricsResult {
  plain: string | null;
  synced: string | null;
  instrumental: boolean;
}

// ── Get Lyrics by metadata ──
export async function getLyrics(params: {
  artistName: string;
  trackName: string;
  albumName?: string;
  duration?: number;
}): Promise<LyricsResult | null> {
  return requestQueue.enqueue('lrclib', async () => {
    const url = new URL(`${BASE_URL}/get`);
    url.searchParams.set('artist_name', params.artistName);
    url.searchParams.set('track_name', params.trackName);
    if (params.albumName) {
      url.searchParams.set('album_name', params.albumName);
    }
    if (params.duration) {
      url.searchParams.set('duration', String(Math.round(params.duration)));
    }

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (response.status === 404) return null;

    if (!response.ok) {
      const error = new Error(`LRCLib API error: ${response.status}`);
      Object.assign(error, { status: response.status });
      throw error;
    }

    const data = (await response.json()) as LRCLibResponse;

    return {
      plain: data.plainLyrics,
      synced: data.syncedLyrics,
      instrumental: data.instrumental,
    };
  });
}

// ── Search Lyrics (fallback if exact match fails) ──
export async function searchLyrics(params: {
  artistName: string;
  trackName: string;
}): Promise<LyricsResult | null> {
  return requestQueue.enqueue('lrclib', async () => {
    const url = new URL(`${BASE_URL}/search`);
    url.searchParams.set('artist_name', params.artistName);
    url.searchParams.set('track_name', params.trackName);

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;

    const results = (await response.json()) as LRCLibResponse[];
    if (results.length === 0) return null;

    // Pick the first result with synced lyrics, or first result
    const best = results.find((r) => r.syncedLyrics) ?? results[0];

    return {
      plain: best.plainLyrics,
      synced: best.syncedLyrics,
      instrumental: best.instrumental,
    };
  });
}
