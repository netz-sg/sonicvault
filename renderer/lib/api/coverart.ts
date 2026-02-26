import { requestQueue } from '@/lib/services/request-queue';

const BASE_URL = 'https://coverartarchive.org';

interface CoverArtResponse {
  images: Array<{
    id: string;
    types: string[];
    front: boolean;
    back: boolean;
    image: string;
    thumbnails: {
      250?: string;
      500?: string;
      1200?: string;
      small?: string;
      large?: string;
    };
  }>;
  release: string;
}

// ── Get Cover Art for a Release ──
export async function getReleaseCoverArt(releaseMbid: string): Promise<CoverArtResponse | null> {
  return requestQueue.enqueue('coverart', async () => {
    const url = `${BASE_URL}/release/${releaseMbid}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (response.status === 404) return null;

    if (!response.ok) {
      const error = new Error(`CoverArt API error: ${response.status}`);
      Object.assign(error, { status: response.status });
      throw error;
    }

    return response.json() as Promise<CoverArtResponse>;
  });
}

// ── Get Front Cover URL (convenience) ──
export async function getFrontCoverUrl(
  releaseMbid: string,
  size: '250' | '500' | '1200' = '500'
): Promise<string | null> {
  const data = await getReleaseCoverArt(releaseMbid);
  if (!data) return null;

  const frontImage = data.images.find((img) => img.front);
  if (!frontImage) return data.images[0]?.thumbnails[size] ?? null;

  return frontImage.thumbnails[size] ?? frontImage.image;
}

// ── Download Cover Image as Buffer ──
export async function downloadCover(
  releaseMbid: string,
  size: '250' | '500' | '1200' = '500'
): Promise<Buffer | null> {
  const url = await getFrontCoverUrl(releaseMbid, size);
  if (!url) return null;

  return requestQueue.enqueue('coverart', async () => {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  });
}

// ── Get Cover URLs for multiple sizes ──
export async function getCoverUrls(releaseMbid: string): Promise<{
  small: string | null;
  medium: string | null;
  large: string | null;
} | null> {
  const data = await getReleaseCoverArt(releaseMbid);
  if (!data) return null;

  const frontImage = data.images.find((img) => img.front) ?? data.images[0];
  if (!frontImage) return null;

  return {
    small: frontImage.thumbnails['250'] ?? frontImage.thumbnails.small ?? null,
    medium: frontImage.thumbnails['500'] ?? frontImage.thumbnails.large ?? null,
    large: frontImage.thumbnails['1200'] ?? frontImage.image,
  };
}
