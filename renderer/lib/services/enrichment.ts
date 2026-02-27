import { db } from '@/lib/db';
import { artists, albums, tracks, settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  searchArtist,
  getArtist,
  searchReleaseGroup,
  getReleaseGroup,
  getReleasesForGroup,
  getRelease,
  extractWikidataUrl,
  extractWikipediaUrl,
} from '@/lib/api/musicbrainz';
import { getCoverUrls, downloadCover } from '@/lib/api/coverart';
import { getArtistImages } from '@/lib/api/fanart';
import { getArtistImagesByMbid } from '@/lib/api/audiodb';
import { searchArtistImage } from '@/lib/api/deezer';
import { getLyrics, searchLyrics } from '@/lib/api/lrclib';
import {
  getBiographyFromWikidata,
  getBiographyFromWikipediaUrl,
} from '@/lib/api/wikipedia';
import fs from 'fs';
import path from 'path';

export interface EnrichmentProgress {
  total: number;
  completed: number;
  failed: number;
  current: string | null;
}

// ── Read metadata language setting from DB ──
function getMetadataLanguage(): string {
  const row = db.select().from(settings).where(eq(settings.key, 'metadata_language')).get();
  return row?.value || 'en';
}

// ══════════════════════════════════════════════════
// Artist Enrichment
// ══════════════════════════════════════════════════

export async function enrichArtist(artistId: string): Promise<boolean> {
  const artist = db.select().from(artists).where(eq(artists.id, artistId)).get();
  if (!artist) return false;

  const lang = getMetadataLanguage();

  try {
    // 1. Search MusicBrainz for artist
    const mbResults = await searchArtist(artist.name, 5, lang);
    if (mbResults.length === 0) {
      db.update(artists)
        .set({ metadataStatus: 'partial', updatedAt: Date.now() })
        .where(eq(artists.id, artistId))
        .run();
      return false;
    }

    const bestMatch = mbResults[0];
    const mbid = bestMatch.id;

    // 2. Get full artist details with relations
    const mbArtist = await getArtist(mbid, lang);

    const genres = mbArtist.genres?.map((g) => g.name) ?? [];
    const tags = mbArtist.tags?.map((t) => t.name) ?? [];

    const updateData: Record<string, unknown> = {
      mbid,
      sortName: mbArtist['sort-name'] || artist.sortName,
      type: mbArtist.type || null,
      country: mbArtist.country || null,
      beginDate: mbArtist['life-span']?.begin || null,
      endDate: mbArtist['life-span']?.end || null,
      genres: genres.length > 0 ? JSON.stringify(genres) : null,
      tags: tags.length > 0 ? JSON.stringify(tags) : null,
      updatedAt: Date.now(),
    };

    // 3. Get biography from Wikipedia
    const wikidataUrl = extractWikidataUrl(mbArtist);
    const wikipediaUrl = extractWikipediaUrl(mbArtist);

    let bio = null;
    if (wikipediaUrl) {
      bio = await getBiographyFromWikipediaUrl(wikipediaUrl, lang);
    } else if (wikidataUrl) {
      bio = await getBiographyFromWikidata(wikidataUrl, lang);
    }

    if (bio?.summary) {
      updateData.biography = bio.summary;
    }

    // 4. Get artist images — multi-source fallback chain
    //    Thumbnail: Fanart.tv → TheAudioDB → Deezer → Wikipedia
    //    Background: Fanart.tv → TheAudioDB → (blurred thumbnail in UI)
    let thumbnailUrl: string | null = null;
    let backgroundUrl: string | null = null;

    // Source 1: Fanart.tv (best quality, needs API key)
    const fanartImages = await getArtistImages(mbid);
    if (fanartImages?.thumbnail) thumbnailUrl = fanartImages.thumbnail;
    if (fanartImages?.background) backgroundUrl = fanartImages.background;

    // Source 2: TheAudioDB (free, no key, good quality)
    if (!thumbnailUrl || !backgroundUrl) {
      try {
        const audiodbImages = await getArtistImagesByMbid(mbid);
        if (!thumbnailUrl && audiodbImages?.thumbnail) thumbnailUrl = audiodbImages.thumbnail;
        if (!backgroundUrl && audiodbImages?.background) backgroundUrl = audiodbImages.background;
      } catch { /* non-critical */ }
    }

    // Source 3: Deezer (free, no key, 1000x1000 thumbnails)
    if (!thumbnailUrl) {
      try {
        const deezerImage = await searchArtistImage(artist.name);
        if (deezerImage?.thumbnail) thumbnailUrl = deezerImage.thumbnail;
      } catch { /* non-critical */ }
    }

    // Source 4: Wikipedia (last resort for thumbnails)
    if (!thumbnailUrl) {
      if (bio?.originalImageUrl) {
        thumbnailUrl = bio.originalImageUrl;
      } else if (bio?.thumbnailUrl) {
        thumbnailUrl = bio.thumbnailUrl;
      }
    }

    // Download and cache artist images locally
    if (thumbnailUrl) {
      const cached = await cacheArtistImage(thumbnailUrl, artistId, 'thumb');
      updateData.imageUrl = cached ? `/api/artists/${artistId}/image` : thumbnailUrl;
    }
    if (backgroundUrl) {
      const cached = await cacheArtistImage(backgroundUrl, artistId, 'fanart');
      updateData.backgroundUrl = cached ? `/api/artists/${artistId}/fanart` : backgroundUrl;
    }

    // Save images to the artist's music folder (for media servers)
    saveArtistImagesToMusicFolder(artistId);

    updateData.metadataStatus = 'complete';

    db.update(artists)
      .set(updateData)
      .where(eq(artists.id, artistId))
      .run();

    return true;
  } catch (error) {
    console.error(`[Enrichment] Artist "${artist.name}" failed:`, error);
    db.update(artists)
      .set({ metadataStatus: 'partial', updatedAt: Date.now() })
      .where(eq(artists.id, artistId))
      .run();
    return false;
  }
}

// ══════════════════════════════════════════════════
// Album Enrichment
// ══════════════════════════════════════════════════

export async function enrichAlbum(albumId: string): Promise<boolean> {
  const album = db.select().from(albums).where(eq(albums.id, albumId)).get();
  if (!album) return false;

  const artist = album.artistId
    ? db.select().from(artists).where(eq(artists.id, album.artistId)).get()
    : null;

  const lang = getMetadataLanguage();

  try {
    let releaseGroupMbid: string | null = null;
    let releaseMbid: string | null = null;

    // 1. Search MusicBrainz for release group
    if (artist?.mbid) {
      const rgResults = await searchReleaseGroup(artist.mbid, album.title, 5, lang);
      if (rgResults.length > 0) {
        releaseGroupMbid = rgResults[0].id;
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (releaseGroupMbid) {
      updateData.mbid = releaseGroupMbid;

      // 2. Get release group details
      const rg = await getReleaseGroup(releaseGroupMbid, lang);
      updateData.type = rg['primary-type'] || null;
      updateData.releaseDate = rg['first-release-date'] || null;

      const genres = rg.tags?.map((t) => t.name) ?? [];
      if (genres.length > 0) {
        updateData.genres = JSON.stringify(genres);
      }

      // 3. Get a specific release for cover art and label info
      const releases = await getReleasesForGroup(releaseGroupMbid);
      if (releases.length > 0) {
        releaseMbid = releases[0].id;
        updateData.releaseMbid = releaseMbid;

        // Get full release details
        const release = await getRelease(releaseMbid);
        const labelInfo = release['label-info']?.[0];
        if (labelInfo) {
          updateData.label = labelInfo.label?.name || null;
          updateData.catalogNumber = labelInfo['catalog-number'] || null;
        }
        updateData.country = release.country || null;

        // Count tracks from release media
        const totalTracks = release.media?.reduce(
          (sum, m) => sum + m['track-count'],
          0
        );
        if (totalTracks) {
          updateData.trackCount = totalTracks;
        }
      }
    }

    // 4. Get cover art (skip if scanner already extracted an embedded cover)
    const dataDir = process.env.DATA_PATH || path.resolve(process.cwd(), '..', 'data');
    const existingCover = path.join(dataDir, 'covers', `${albumId}.jpg`);
    const hasLocalCover = fs.existsSync(existingCover);

    if (releaseMbid && !hasLocalCover) {
      const covers = await getCoverUrls(releaseMbid);
      if (covers) {
        // Download and cache cover locally (1200px for best quality)
        const cached = await cacheCoverImage(albumId, releaseMbid);

        // Use local API route if cached successfully, otherwise fall back to remote
        updateData.coverUrl = cached ? `/api/covers/${albumId}` : (covers.large || covers.medium);
        updateData.coverSmall = cached ? `/api/covers/${albumId}` : (covers.small || covers.medium);
      }
    } else if (hasLocalCover && !album.coverUrl) {
      // Cover was saved by scanner but DB wasn't updated (edge case)
      updateData.coverUrl = `/api/covers/${albumId}`;
      updateData.coverSmall = `/api/covers/${albumId}`;
    }

    updateData.metadataStatus = releaseGroupMbid ? 'complete' : 'partial';

    db.update(albums)
      .set(updateData)
      .where(eq(albums.id, albumId))
      .run();

    return !!releaseGroupMbid;
  } catch (error) {
    console.error(`[Enrichment] Album "${album.title}" failed:`, error);
    db.update(albums)
      .set({ metadataStatus: 'partial', updatedAt: Date.now() })
      .where(eq(albums.id, albumId))
      .run();
    return false;
  }
}

// ══════════════════════════════════════════════════
// Track Enrichment (Lyrics)
// ══════════════════════════════════════════════════

export async function enrichTrack(trackId: string): Promise<boolean> {
  const track = db.select().from(tracks).where(eq(tracks.id, trackId)).get();
  if (!track) return false;

  const artist = track.artistId
    ? db.select().from(artists).where(eq(artists.id, track.artistId)).get()
    : null;
  const album = track.albumId
    ? db.select().from(albums).where(eq(albums.id, track.albumId)).get()
    : null;

  try {
    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    // Get lyrics from LRCLib
    if (artist) {
      const durationSec = track.durationMs ? track.durationMs / 1000 : undefined;

      let lyrics = await getLyrics({
        artistName: artist.name,
        trackName: track.title,
        albumName: album?.title,
        duration: durationSec,
      });

      // Fallback: search without album/duration
      if (!lyrics) {
        lyrics = await searchLyrics({
          artistName: artist.name,
          trackName: track.title,
        });
      }

      if (lyrics) {
        if (lyrics.plain) updateData.lyricsPlain = lyrics.plain;
        if (lyrics.synced) updateData.lyricsSynced = lyrics.synced;
      }
    }

    updateData.metadataStatus = 'complete';

    db.update(tracks)
      .set(updateData)
      .where(eq(tracks.id, trackId))
      .run();

    return true;
  } catch (error) {
    console.error(`[Enrichment] Track "${track.title}" failed:`, error);
    db.update(tracks)
      .set({ metadataStatus: 'partial', updatedAt: Date.now() })
      .where(eq(tracks.id, trackId))
      .run();
    return false;
  }
}

// ══════════════════════════════════════════════════
// Batch Enrichment Pipeline
// ══════════════════════════════════════════════════

export async function enrichAll(): Promise<EnrichmentProgress> {
  const progress: EnrichmentProgress = {
    total: 0,
    completed: 0,
    failed: 0,
    current: null,
  };

  // 1. Enrich pending artists
  const pendingArtists = db
    .select({ id: artists.id, name: artists.name })
    .from(artists)
    .where(eq(artists.metadataStatus, 'pending'))
    .all();

  progress.total += pendingArtists.length;

  for (const artist of pendingArtists) {
    progress.current = `Artist: ${artist.name}`;
    const success = await enrichArtist(artist.id);
    if (success) progress.completed++;
    else progress.failed++;
  }

  // 2. Enrich pending albums
  const pendingAlbums = db
    .select({ id: albums.id, title: albums.title })
    .from(albums)
    .where(eq(albums.metadataStatus, 'pending'))
    .all();

  progress.total += pendingAlbums.length;

  for (const album of pendingAlbums) {
    progress.current = `Album: ${album.title}`;
    const success = await enrichAlbum(album.id);
    if (success) progress.completed++;
    else progress.failed++;
  }

  // 3. Enrich pending tracks (lyrics)
  const pendingTracks = db
    .select({ id: tracks.id, title: tracks.title })
    .from(tracks)
    .where(eq(tracks.metadataStatus, 'pending'))
    .all();

  progress.total += pendingTracks.length;

  for (const track of pendingTracks) {
    progress.current = `Track: ${track.title}`;
    const success = await enrichTrack(track.id);
    if (success) progress.completed++;
    else progress.failed++;
  }

  progress.current = null;
  return progress;
}

// ══════════════════════════════════════════════════
// Cover Cache Helper
// ══════════════════════════════════════════════════

// ── Copy cached artist images to their music folder (artist.jpg + fanart.jpg for media servers) ──
function saveArtistImagesToMusicFolder(artistId: string): void {
  try {
    const dataDir = process.env.DATA_PATH || path.resolve(process.cwd(), '..', 'data');
    const thumbCache = path.join(dataDir, 'artists', `${artistId}.jpg`);
    const fanartCache = path.join(dataDir, 'artists', `${artistId}-fanart.jpg`);

    // Find artist directories from track file paths
    const artistTracks = db.select({ filePath: tracks.filePath })
      .from(tracks)
      .where(eq(tracks.artistId, artistId))
      .all();

    const artistDirs = new Set<string>();
    for (const t of artistTracks) {
      if (!t.filePath) continue;
      const albumDir = path.dirname(t.filePath);
      const artistDir = path.dirname(albumDir);
      if (fs.existsSync(artistDir)) {
        artistDirs.add(artistDir);
      }
    }

    for (const dir of artistDirs) {
      // artist.jpg (thumbnail for Plex/Emby/Jellyfin/Kodi)
      if (fs.existsSync(thumbCache)) {
        const target = path.join(dir, 'artist.jpg');
        if (!fs.existsSync(target)) {
          fs.copyFileSync(thumbCache, target);
        }
      }
      // fanart.jpg (background/hero for Kodi/Jellyfin)
      if (fs.existsSync(fanartCache)) {
        const target = path.join(dir, 'fanart.jpg');
        if (!fs.existsSync(target)) {
          fs.copyFileSync(fanartCache, target);
        }
      }
    }
  } catch {
    // Not critical — NFO generator can handle this later
  }
}

async function cacheArtistImage(
  imageUrl: string,
  artistId: string,
  type: 'thumb' | 'fanart'
): Promise<boolean> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return false;
    const buffer = Buffer.from(await response.arrayBuffer());

    const dataDir = process.env.DATA_PATH || path.resolve(process.cwd(), '..', 'data');
    const artistsDir = path.join(dataDir, 'artists');

    if (!fs.existsSync(artistsDir)) {
      fs.mkdirSync(artistsDir, { recursive: true });
    }

    const filename = type === 'thumb' ? `${artistId}.jpg` : `${artistId}-fanart.jpg`;
    fs.writeFileSync(path.join(artistsDir, filename), buffer);
    return true;
  } catch {
    return false;
  }
}

async function cacheCoverImage(albumId: string, releaseMbid: string): Promise<boolean> {
  try {
    const buffer = await downloadCover(releaseMbid, '1200');
    if (!buffer) return false;

    const dataDir = process.env.DATA_PATH || path.resolve(process.cwd(), '..', 'data');
    const coversDir = path.join(dataDir, 'covers');

    if (!fs.existsSync(coversDir)) {
      fs.mkdirSync(coversDir, { recursive: true });
    }

    const coverPath = path.join(coversDir, `${albumId}.jpg`);
    fs.writeFileSync(coverPath, buffer);
    return true;
  } catch {
    return false;
  }
}
