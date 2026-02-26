import { requestQueue } from '@/lib/services/request-queue';

const BASE_URL = 'https://webservice.fanart.tv/v3/music';

interface FanartArtistResponse {
  name: string;
  mbid_id: string;
  artistthumb?: FanartImage[];
  artistbackground?: FanartImage[];
  hdmusiclogo?: FanartImage[];
  musiclogo?: FanartImage[];
  musicbanner?: FanartImage[];
  albums?: Record<string, {
    albumcover?: FanartImage[];
    cdart?: FanartImage[];
  }>;
}

interface FanartImage {
  id: string;
  url: string;
  likes: string;
}

export interface FanartArtistImages {
  thumbnail: string | null;
  background: string | null;
  logo: string | null;
}

function getApiKey(): string | null {
  return process.env.FANART_API_KEY || null;
}

// ── Get Artist Images ──
export async function getArtistImages(artistMbid: string): Promise<FanartArtistImages | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[Fanart.tv] No API key configured. Skipping artist image fetch.');
    return null;
  }

  return requestQueue.enqueue('fanart', async () => {
    const url = `${BASE_URL}/${artistMbid}?api_key=${apiKey}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (response.status === 404) return null;

    if (!response.ok) {
      const error = new Error(`Fanart.tv API error: ${response.status}`);
      Object.assign(error, { status: response.status });
      throw error;
    }

    const data = (await response.json()) as FanartArtistResponse;

    // Pick the most-liked image from each category
    const bestImage = (images?: FanartImage[]): string | null => {
      if (!images || images.length === 0) return null;
      const sorted = [...images].sort((a, b) => Number(b.likes) - Number(a.likes));
      return sorted[0].url;
    };

    return {
      thumbnail: bestImage(data.artistthumb),
      background: bestImage(data.artistbackground),
      logo: bestImage(data.hdmusiclogo) ?? bestImage(data.musiclogo),
    };
  });
}

// ── Check if Fanart.tv is configured ──
export function isFanartConfigured(): boolean {
  return !!getApiKey();
}
