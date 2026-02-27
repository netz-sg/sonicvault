import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tracks, artists, albums } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getLyrics, searchLyrics } from '@/lib/api/lrclib';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const track = db
      .select()
      .from(tracks)
      .where(eq(tracks.id, params.id))
      .get();

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Return cached lyrics if available
    if (track.lyricsPlain || track.lyricsSynced) {
      return NextResponse.json({
        plain: track.lyricsPlain,
        synced: track.lyricsSynced,
        cached: true,
      });
    }

    // Fetch fresh lyrics
    const artist = track.artistId
      ? db.select({ name: artists.name }).from(artists).where(eq(artists.id, track.artistId)).get()
      : null;
    const album = track.albumId
      ? db.select({ title: albums.title }).from(albums).where(eq(albums.id, track.albumId)).get()
      : null;

    if (!artist) {
      return NextResponse.json({ plain: null, synced: null, cached: false });
    }

    const durationSec = track.durationMs ? track.durationMs / 1000 : undefined;

    let lyrics = await getLyrics({
      artistName: artist.name,
      trackName: track.title,
      albumName: album?.title,
      duration: durationSec,
    });

    if (!lyrics) {
      lyrics = await searchLyrics({
        artistName: artist.name,
        trackName: track.title,
      });
    }

    // Cache the result
    if (lyrics) {
      db.update(tracks)
        .set({
          lyricsPlain: lyrics.plain,
          lyricsSynced: lyrics.synced,
          updatedAt: Date.now(),
        })
        .where(eq(tracks.id, params.id))
        .run();
    }

    return NextResponse.json({
      plain: lyrics?.plain ?? null,
      synced: lyrics?.synced ?? null,
      cached: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch lyrics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
