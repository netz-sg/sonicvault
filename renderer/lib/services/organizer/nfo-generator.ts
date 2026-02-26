import fs from 'fs';
import path from 'path';
import { db } from '@/lib/db';
import { artists, albums, tracks, settings } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { extractYear } from '@/lib/utils/audio';

// ═══════════════════════════════════════════════════════
// NFO Generator — Kodi / Jellyfin / Emby / Plex compatible
// Generates artist.nfo + album.nfo XML metadata files
// ═══════════════════════════════════════════════════════

export interface NfoResult {
  artistNfos: number;
  albumNfos: number;
  coversCopied: number;
  lyricsFiles: number;
  errors: Array<{ id: string; error: string }>;
}

function getSetting(key: string): string | null {
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  return row?.value ?? null;
}

// ── XML Escape ──

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── Generate artist.nfo ──

function generateArtistNfo(artist: {
  name: string;
  mbid: string | null;
  sortName: string | null;
  type: string | null;
  biography: string | null;
  genres: string | null;
  country: string | null;
  beginDate: string | null;
  endDate: string | null;
  imageUrl: string | null;
  backgroundUrl: string | null;
}): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  lines.push('<artist>');
  lines.push(`  <name>${escapeXml(artist.name)}</name>`);

  if (artist.mbid) {
    lines.push(`  <musicBrainzArtistID>${escapeXml(artist.mbid)}</musicBrainzArtistID>`);
  }
  if (artist.sortName) {
    lines.push(`  <sortname>${escapeXml(artist.sortName)}</sortname>`);
  }
  if (artist.type) {
    lines.push(`  <type>${escapeXml(artist.type)}</type>`);
  }

  // Genres
  if (artist.genres) {
    try {
      const genreArr = JSON.parse(artist.genres);
      if (Array.isArray(genreArr)) {
        for (const genre of genreArr) {
          lines.push(`  <genre>${escapeXml(String(genre))}</genre>`);
        }
      }
    } catch { /* ignore */ }
  }

  if (artist.biography) {
    lines.push(`  <biography>${escapeXml(artist.biography)}</biography>`);
  }

  // Dates: born/formed for groups vs persons
  if (artist.beginDate) {
    if (artist.type === 'Group') {
      lines.push(`  <formed>${escapeXml(artist.beginDate)}</formed>`);
    } else {
      lines.push(`  <born>${escapeXml(artist.beginDate)}</born>`);
    }
  }
  if (artist.endDate) {
    if (artist.type === 'Group') {
      lines.push(`  <disbanded>${escapeXml(artist.endDate)}</disbanded>`);
    } else {
      lines.push(`  <died>${escapeXml(artist.endDate)}</died>`);
    }
  }

  // Thumb (local file reference)
  lines.push('  <thumb>artist.jpg</thumb>');

  // Fanart
  if (artist.backgroundUrl) {
    lines.push('  <fanart>');
    lines.push('    <thumb>fanart.jpg</thumb>');
    lines.push('  </fanart>');
  }

  lines.push('</artist>');
  return lines.join('\n');
}

// ── Generate album.nfo ──

function generateAlbumNfo(album: {
  title: string;
  mbid: string | null;
  releaseMbid: string | null;
  releaseDate: string | null;
  type: string | null;
  label: string | null;
  genres: string | null;
  artistName: string | null;
  artistMbid: string | null;
  trackList: Array<{
    title: string;
    trackNumber: number | null;
    discNumber: number | null;
    durationMs: number | null;
  }>;
}): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  lines.push('<album>');
  lines.push(`  <title>${escapeXml(album.title)}</title>`);

  if (album.mbid) {
    lines.push(`  <musicBrainzReleaseGroupID>${escapeXml(album.mbid)}</musicBrainzReleaseGroupID>`);
  }
  if (album.releaseMbid) {
    lines.push(`  <musicBrainzAlbumID>${escapeXml(album.releaseMbid)}</musicBrainzAlbumID>`);
  }
  if (album.artistName) {
    lines.push(`  <albumArtistCredits>`);
    lines.push(`    <artist>${escapeXml(album.artistName)}</artist>`);
    if (album.artistMbid) {
      lines.push(`    <musicBrainzArtistID>${escapeXml(album.artistMbid)}</musicBrainzArtistID>`);
    }
    lines.push(`  </albumArtistCredits>`);
  }

  // Genres
  if (album.genres) {
    try {
      const genreArr = JSON.parse(album.genres);
      if (Array.isArray(genreArr)) {
        for (const genre of genreArr) {
          lines.push(`  <genre>${escapeXml(String(genre))}</genre>`);
        }
      }
    } catch { /* ignore */ }
  }

  const year = extractYear(album.releaseDate);
  if (year !== 'Unknown') {
    lines.push(`  <year>${year}</year>`);
  }
  if (album.releaseDate) {
    lines.push(`  <releasedate>${escapeXml(album.releaseDate)}</releasedate>`);
  }
  if (album.label) {
    lines.push(`  <label>${escapeXml(album.label)}</label>`);
  }
  if (album.type) {
    lines.push(`  <type>${escapeXml(album.type)}</type>`);
  }

  // Thumb
  lines.push('  <thumb>cover.jpg</thumb>');

  // Track listing
  for (const track of album.trackList) {
    const discAttr = track.discNumber && track.discNumber > 1
      ? ` disc="${track.discNumber}"`
      : '';
    const durationSec = track.durationMs
      ? Math.round(track.durationMs / 1000)
      : 0;

    lines.push('  <track>');
    lines.push(`    <position>${track.trackNumber || 0}</position>`);
    lines.push(`    <title>${escapeXml(track.title)}</title>`);
    lines.push(`    <duration>${durationSec}</duration>`);
    if (discAttr) {
      lines.push(`    <disc>${track.discNumber}</disc>`);
    }
    lines.push('  </track>');
  }

  lines.push('</album>');
  return lines.join('\n');
}

// ── Find Artist Directories in Library ──

function findArtistDirectories(artistId: string): string[] {
  const dirs = new Set<string>();

  const artistTracks = db.select({ filePath: tracks.filePath })
    .from(tracks)
    .where(eq(tracks.artistId, artistId))
    .all();

  for (const t of artistTracks) {
    if (!t.filePath) continue;
    // Track path: library/Artist/Album/track.flac → artist dir is 2 levels up
    const albumDir = path.dirname(t.filePath);
    const artistDir = path.dirname(albumDir);
    if (fs.existsSync(artistDir)) {
      dirs.add(artistDir);
    }
  }

  return [...dirs];
}

// ── Find Album Directory ──

function findAlbumDirectory(albumId: string): string | null {
  const albumTracks = db.select({ filePath: tracks.filePath })
    .from(tracks)
    .where(eq(tracks.albumId, albumId))
    .all();

  const firstTrack = albumTracks.find(t => t.filePath);
  if (!firstTrack?.filePath) return null;

  const albumDir = path.dirname(firstTrack.filePath);
  return fs.existsSync(albumDir) ? albumDir : null;
}

// ── Save Artist Image (prefer local cache, fallback to URL download) ──

async function saveArtistImage(imageUrl: string, targetPath: string, artistId?: string, type?: 'thumb' | 'fanart'): Promise<boolean> {
  try {
    // Try local cache first (from enrichment)
    if (artistId) {
      const dataDir = process.env.DATA_PATH || path.resolve(process.cwd(), '..', 'data');
      const filename = type === 'fanart' ? `${artistId}-fanart.jpg` : `${artistId}.jpg`;
      const cachedPath = path.join(dataDir, 'artists', filename);
      if (fs.existsSync(cachedPath)) {
        fs.copyFileSync(cachedPath, targetPath);
        return true;
      }
    }

    // Fallback: download from URL
    const response = await fetch(imageUrl);
    if (!response.ok) return false;
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(targetPath, buffer);
    return true;
  } catch {
    return false;
  }
}

// ══════════════════════════════════════════════════
// Main: Generate All NFO Files
// ══════════════════════════════════════════════════

export async function generateAllNfos(): Promise<NfoResult> {
  const result: NfoResult = {
    artistNfos: 0,
    albumNfos: 0,
    coversCopied: 0,
    lyricsFiles: 0,
    errors: [],
  };

  const libraryPath = getSetting('library_path');
  if (!libraryPath) {
    result.errors.push({ id: 'settings', error: 'Library path not configured' });
    return result;
  }

  const dataDir = process.env.DATA_PATH || path.resolve(process.cwd(), '..', 'data');

  // ── Artist NFOs ──
  const allArtists = db.select().from(artists).all();

  for (const artist of allArtists) {
    try {
      const artistDirs = findArtistDirectories(artist.id);
      if (artistDirs.length === 0) continue;

      const nfoContent = generateArtistNfo({
        name: artist.name,
        mbid: artist.mbid,
        sortName: artist.sortName,
        type: artist.type,
        biography: artist.biography,
        genres: artist.genres,
        country: artist.country,
        beginDate: artist.beginDate,
        endDate: artist.endDate,
        imageUrl: artist.imageUrl,
        backgroundUrl: artist.backgroundUrl,
      });

      // Write to each artist directory
      for (const dir of artistDirs) {
        const nfoPath = path.join(dir, 'artist.nfo');
        fs.writeFileSync(nfoPath, nfoContent, 'utf-8');
      }
      result.artistNfos++;

      // Download artist image to artist directory if available
      if (artist.imageUrl && artistDirs.length > 0) {
        const imgPath = path.join(artistDirs[0], 'artist.jpg');
        if (!fs.existsSync(imgPath)) {
          await saveArtistImage(artist.imageUrl, imgPath, artist.id, 'thumb');
        }
      }

      // Download fanart/background if available
      if (artist.backgroundUrl && artistDirs.length > 0) {
        const fanartPath = path.join(artistDirs[0], 'fanart.jpg');
        if (!fs.existsSync(fanartPath)) {
          await saveArtistImage(artist.backgroundUrl, fanartPath, artist.id, 'fanart');
        }
      }
    } catch (err) {
      result.errors.push({
        id: artist.id,
        error: err instanceof Error ? err.message : 'Failed to generate artist NFO',
      });
    }
  }

  // ── Album NFOs ──
  const allAlbums = db.select().from(albums).all();

  for (const album of allAlbums) {
    try {
      const albumDir = findAlbumDirectory(album.id);
      if (!albumDir) continue;

      // Get artist info
      const artist = album.artistId
        ? db.select({ name: artists.name, mbid: artists.mbid })
            .from(artists).where(eq(artists.id, album.artistId)).get()
        : null;

      // Get track listing
      const trackList = db.select({
        title: tracks.title,
        trackNumber: tracks.trackNumber,
        discNumber: tracks.discNumber,
        durationMs: tracks.durationMs,
      })
        .from(tracks)
        .where(eq(tracks.albumId, album.id))
        .orderBy(tracks.discNumber, tracks.trackNumber)
        .all();

      const nfoContent = generateAlbumNfo({
        title: album.title,
        mbid: album.mbid,
        releaseMbid: album.releaseMbid,
        releaseDate: album.releaseDate,
        type: album.type,
        label: album.label,
        genres: album.genres,
        artistName: artist?.name ?? null,
        artistMbid: artist?.mbid ?? null,
        trackList,
      });

      const nfoPath = path.join(albumDir, 'album.nfo');
      fs.writeFileSync(nfoPath, nfoContent, 'utf-8');
      result.albumNfos++;

      // Copy cover.jpg to album directory if not already there
      const coverSource = path.join(dataDir, 'covers', `${album.id}.jpg`);
      const coverTarget = path.join(albumDir, 'cover.jpg');
      const folderTarget = path.join(albumDir, 'folder.jpg');

      if (fs.existsSync(coverSource)) {
        if (!fs.existsSync(coverTarget)) {
          fs.copyFileSync(coverSource, coverTarget);
          result.coversCopied++;
        }
        // Plex uses folder.jpg
        if (!fs.existsSync(folderTarget)) {
          fs.copyFileSync(coverSource, folderTarget);
        }
      }
    } catch (err) {
      result.errors.push({
        id: album.id,
        error: err instanceof Error ? err.message : 'Failed to generate album NFO',
      });
    }
  }

  // ── Lyrics .lrc Files ──
  const tracksWithLyrics = db.select({
    id: tracks.id,
    filePath: tracks.filePath,
    lyricsSynced: tracks.lyricsSynced,
    lyricsPlain: tracks.lyricsPlain,
  })
    .from(tracks)
    .where(sql`${tracks.filePath} IS NOT NULL AND (${tracks.lyricsSynced} IS NOT NULL OR ${tracks.lyricsPlain} IS NOT NULL)`)
    .all();

  for (const track of tracksWithLyrics) {
    if (!track.filePath) continue;
    try {
      const ext = path.extname(track.filePath);
      const lrcPath = track.filePath.slice(0, -ext.length) + '.lrc';

      if (fs.existsSync(lrcPath)) continue;

      // Prefer synced lyrics (with timestamps), fallback to plain
      const content = track.lyricsSynced || track.lyricsPlain;
      if (!content) continue;

      fs.writeFileSync(lrcPath, content, 'utf-8');
      result.lyricsFiles++;
    } catch (err) {
      result.errors.push({
        id: track.id,
        error: err instanceof Error ? err.message : 'Failed to write .lrc file',
      });
    }
  }

  return result;
}

// ══════════════════════════════════════════════════
// Generate NFOs for specific albums/artists
// ══════════════════════════════════════════════════

export async function generateNfosForAlbum(albumId: string): Promise<boolean> {
  const album = db.select().from(albums).where(eq(albums.id, albumId)).get();
  if (!album) return false;

  const albumDir = findAlbumDirectory(albumId);
  if (!albumDir) return false;

  const artist = album.artistId
    ? db.select({ name: artists.name, mbid: artists.mbid })
        .from(artists).where(eq(artists.id, album.artistId)).get()
    : null;

  const trackList = db.select({
    title: tracks.title,
    trackNumber: tracks.trackNumber,
    discNumber: tracks.discNumber,
    durationMs: tracks.durationMs,
  })
    .from(tracks)
    .where(eq(tracks.albumId, albumId))
    .orderBy(tracks.discNumber, tracks.trackNumber)
    .all();

  const nfoContent = generateAlbumNfo({
    title: album.title,
    mbid: album.mbid,
    releaseMbid: album.releaseMbid,
    releaseDate: album.releaseDate,
    type: album.type,
    label: album.label,
    genres: album.genres,
    artistName: artist?.name ?? null,
    artistMbid: artist?.mbid ?? null,
    trackList,
  });

  const nfoPath = path.join(albumDir, 'album.nfo');
  fs.writeFileSync(nfoPath, nfoContent, 'utf-8');

  // Also copy cover files
  const dataDir = process.env.DATA_PATH || path.resolve(process.cwd(), '..', 'data');
  const coverSource = path.join(dataDir, 'covers', `${albumId}.jpg`);

  if (fs.existsSync(coverSource)) {
    const coverTarget = path.join(albumDir, 'cover.jpg');
    const folderTarget = path.join(albumDir, 'folder.jpg');
    if (!fs.existsSync(coverTarget)) fs.copyFileSync(coverSource, coverTarget);
    if (!fs.existsSync(folderTarget)) fs.copyFileSync(coverSource, folderTarget);
  }

  return true;
}
