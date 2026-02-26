import { requestQueue } from '@/lib/services/request-queue';

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

function getWikipediaApiUrl(lang: string): string {
  return `https://${lang}.wikipedia.org/api/rest_v1`;
}

interface WikipediaSummary {
  title: string;
  extract: string;
  extract_html?: string;
  description?: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  originalimage?: {
    source: string;
    width: number;
    height: number;
  };
  content_urls?: {
    desktop: { page: string };
    mobile: { page: string };
  };
}

export interface ArtistBio {
  summary: string;
  fullUrl: string | null;
  thumbnailUrl: string | null;
  originalImageUrl: string | null;
}

// ── Get Biography from Wikipedia page title ──
export async function getBiographyByTitle(pageTitle: string, lang = 'en'): Promise<ArtistBio | null> {
  return requestQueue.enqueue('wikipedia', async () => {
    const encoded = encodeURIComponent(pageTitle.replace(/ /g, '_'));
    const url = `${getWikipediaApiUrl(lang)}/page/summary/${encoded}`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (response.status === 404) return null;

    if (!response.ok) {
      const error = new Error(`Wikipedia API error: ${response.status}`);
      Object.assign(error, { status: response.status });
      throw error;
    }

    const data = (await response.json()) as WikipediaSummary;

    return {
      summary: data.extract || '',
      fullUrl: data.content_urls?.desktop.page ?? null,
      thumbnailUrl: data.thumbnail?.source ?? null,
      originalImageUrl: data.originalimage?.source ?? null,
    };
  });
}

// ── Resolve Wikidata ID to Wikipedia page title ──
export async function getWikipediaTitleFromWikidata(wikidataUrl: string, lang = 'en'): Promise<string | null> {
  // Extract Wikidata ID (e.g., Q5432 from https://www.wikidata.org/wiki/Q5432)
  const match = wikidataUrl.match(/Q\d+/);
  if (!match) return null;
  const wikidataId = match[0];
  const siteKey = `${lang}wiki`;

  return requestQueue.enqueue('wikipedia', async () => {
    const url = new URL(WIKIDATA_API);
    url.searchParams.set('action', 'wbgetentities');
    url.searchParams.set('ids', wikidataId);
    url.searchParams.set('props', 'sitelinks');
    url.searchParams.set('sitefilter', siteKey);
    url.searchParams.set('format', 'json');

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      entities: Record<string, {
        sitelinks?: Record<string, { title: string }>;
      }>;
    };

    const entity = data.entities[wikidataId];
    return entity?.sitelinks?.[siteKey]?.title ?? null;
  });
}

// ── Get Biography via Wikidata URL (from MusicBrainz relation) ──
export async function getBiographyFromWikidata(wikidataUrl: string, lang = 'en'): Promise<ArtistBio | null> {
  const title = await getWikipediaTitleFromWikidata(wikidataUrl, lang);
  if (!title) return null;
  return getBiographyByTitle(title, lang);
}

// ── Get Biography from Wikipedia URL (direct) ──
export async function getBiographyFromWikipediaUrl(wikipediaUrl: string, lang = 'en'): Promise<ArtistBio | null> {
  // Extract title from URL like https://en.wikipedia.org/wiki/Metallica
  const match = wikipediaUrl.match(/\/wiki\/(.+?)(?:#|$|\?)/);
  if (!match) return null;
  const title = decodeURIComponent(match[1]);
  return getBiographyByTitle(title, lang);
}
