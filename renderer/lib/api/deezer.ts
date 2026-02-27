import { requestQueue } from '@/lib/services/request-queue';

// Deezer API — Completely free, no API key required
// Provides high-resolution artist pictures (up to 1000x1000)

const BASE_URL = 'https://api.deezer.com';

interface DeezerSearchResponse {
  data: DeezerArtistResult[];
}

interface DeezerArtistResult {
  id: number;
  name: string;
  picture_xl: string;
  picture_big: string;
  picture_medium: string;
}

export interface DeezerArtistImage {
  thumbnail: string | null;
}

export async function searchArtistImage(artistName: string): Promise<DeezerArtistImage | null> {
  return requestQueue.enqueue('deezer', async () => {
    const url = `${BASE_URL}/search/artist?q=${encodeURIComponent(artistName)}&limit=3`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as DeezerSearchResponse;
    if (!data.data || data.data.length === 0) return null;

    // Match by name (case-insensitive) to avoid wrong artist
    const nameLower = artistName.toLowerCase();
    const match = data.data.find((a) => a.name.toLowerCase() === nameLower) || data.data[0];

    // picture_xl = 1000x1000, picture_big = 500x500
    const imageUrl = match.picture_xl || match.picture_big || null;

    // Deezer returns a placeholder image URL if no picture exists, skip those
    if (imageUrl && imageUrl.includes('/artist//')) return null;

    return { thumbnail: imageUrl };
  });
}
