import { requestQueue } from '@/lib/services/request-queue';

// TheAudioDB — Free tier (API key "2" = public test key)
// Provides artist thumbnails, fanart/backgrounds, and banners
// No registration needed. Rate-limited but generous.

const BASE_URL = 'https://theaudiodb.com/api/v1/json/2';

interface AudioDBResponse {
  artists: AudioDBArtist[] | null;
}

interface AudioDBArtist {
  strArtistThumb?: string | null;
  strArtistFanart?: string | null;
  strArtistFanart2?: string | null;
  strArtistFanart3?: string | null;
  strArtistFanart4?: string | null;
  strArtistBanner?: string | null;
  strArtistCutout?: string | null;
  strArtistClearart?: string | null;
  strArtistWideThumb?: string | null;
}

export interface AudioDBArtistImages {
  thumbnail: string | null;
  background: string | null;
}

export async function getArtistImagesByMbid(mbid: string): Promise<AudioDBArtistImages | null> {
  return requestQueue.enqueue('audiodb', async () => {
    const url = `${BASE_URL}/artist-mb.php?i=${encodeURIComponent(mbid)}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as AudioDBResponse;
    const artist = data.artists?.[0];
    if (!artist) return null;

    // Pick first available fanart as background
    const background =
      artist.strArtistFanart ||
      artist.strArtistFanart2 ||
      artist.strArtistFanart3 ||
      artist.strArtistFanart4 ||
      artist.strArtistWideThumb ||
      null;

    return {
      thumbnail: artist.strArtistThumb || null,
      background,
    };
  });
}
