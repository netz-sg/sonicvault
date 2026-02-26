import { requestQueue } from '@/lib/services/request-queue';

const BASE_URL = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'SonicVault/1.0.0 (kontakt@sonicvault.app)';

interface MBSearchResult<T> {
  count: number;
  offset: number;
  artists?: T[];
  'release-groups'?: T[];
  releases?: T[];
  recordings?: T[];
}

export interface MBArtist {
  id: string;
  name: string;
  'sort-name': string;
  type?: string;
  country?: string;
  'life-span'?: {
    begin?: string;
    end?: string;
    ended?: boolean;
  };
  tags?: Array<{ name: string; count: number }>;
  genres?: Array<{ name: string; count: number }>;
  relations?: MBRelation[];
}

export interface MBReleaseGroup {
  id: string;
  title: string;
  'primary-type'?: string;
  'first-release-date'?: string;
  'secondary-types'?: string[];
  'artist-credit'?: Array<{ artist: { id: string; name: string } }>;
  tags?: Array<{ name: string; count: number }>;
  releases?: MBRelease[];
}

export interface MBRelease {
  id: string;
  title: string;
  date?: string;
  country?: string;
  'label-info'?: Array<{
    'catalog-number'?: string;
    label?: { id: string; name: string };
  }>;
  media?: Array<{
    position: number;
    'track-count': number;
    tracks?: MBTrack[];
  }>;
}

export interface MBTrack {
  id: string;
  title: string;
  number: string;
  position: number;
  length?: number;
  recording: {
    id: string;
    title: string;
    length?: number;
    genres?: Array<{ name: string; count: number }>;
  };
}

export interface MBRelation {
  type: string;
  'target-type'?: string;
  url?: { resource: string };
}

async function mbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  return requestQueue.enqueue('musicbrainz', async () => {
    const url = new URL(`${BASE_URL}${path}`);
    url.searchParams.set('fmt', 'json');
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const error = new Error(`MusicBrainz API error: ${response.status} ${response.statusText}`);
      Object.assign(error, { status: response.status });
      throw error;
    }

    return response.json() as Promise<T>;
  });
}

// ── Artist Search ──
export async function searchArtist(query: string, limit = 5, locale?: string): Promise<MBArtist[]> {
  const params: Record<string, string> = {
    query: `artist:"${query}"`,
    limit: String(limit),
  };
  if (locale) params.locale = locale;
  const result = await mbFetch<MBSearchResult<MBArtist>>('/artist', params);
  return result.artists ?? [];
}

// ── Artist Details (with relations for Wikipedia link) ──
export async function getArtist(mbid: string, locale?: string): Promise<MBArtist> {
  const params: Record<string, string> = { inc: 'tags+genres+url-rels' };
  if (locale) params.locale = locale;
  return mbFetch<MBArtist>(`/artist/${mbid}`, params);
}

// ── Release Group Search ──
export async function searchReleaseGroup(
  artistMbid: string,
  albumName: string,
  limit = 5,
  locale?: string
): Promise<MBReleaseGroup[]> {
  const params: Record<string, string> = {
    query: `releasegroup:"${albumName}" AND arid:${artistMbid}`,
    limit: String(limit),
  };
  if (locale) params.locale = locale;
  const result = await mbFetch<MBSearchResult<MBReleaseGroup>>('/release-group', params);
  return result['release-groups'] ?? [];
}

// ── Release Group Details ──
export async function getReleaseGroup(mbid: string, locale?: string): Promise<MBReleaseGroup> {
  const params: Record<string, string> = { inc: 'releases+tags+genres' };
  if (locale) params.locale = locale;
  return mbFetch<MBReleaseGroup>(`/release-group/${mbid}`, params);
}

// ── Release Details (with tracklist) ──
export async function getRelease(mbid: string): Promise<MBRelease> {
  return mbFetch<MBRelease>(`/release/${mbid}`, {
    inc: 'recordings+labels+media',
  });
}

// ── Browse Releases for a Release Group ──
export async function getReleasesForGroup(releaseGroupMbid: string): Promise<MBRelease[]> {
  const result = await mbFetch<{ releases: MBRelease[] }>('/release', {
    'release-group': releaseGroupMbid,
    limit: '10',
  });
  return result.releases ?? [];
}

// ── Extract Wikidata URL from Artist Relations ──
export function extractWikidataUrl(artist: MBArtist): string | null {
  const wikidataRel = artist.relations?.find(
    (r) => r.type === 'wikidata' && r.url?.resource
  );
  return wikidataRel?.url?.resource ?? null;
}

export function extractWikipediaUrl(artist: MBArtist): string | null {
  const wikiRel = artist.relations?.find(
    (r) => r.type === 'wikipedia' && r.url?.resource
  );
  return wikiRel?.url?.resource ?? null;
}
