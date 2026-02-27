import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tracks, albums, artists } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

    const album = track.albumId
      ? db.select().from(albums).where(eq(albums.id, track.albumId)).get()
      : null;

    const artist = track.artistId
      ? db.select().from(artists).where(eq(artists.id, track.artistId)).get()
      : null;

    return NextResponse.json({
      ...track,
      album: album
        ? { id: album.id, title: album.title, coverUrl: album.coverUrl, coverSmall: album.coverSmall }
        : null,
      artist: artist
        ? { id: artist.id, name: artist.name }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch track';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
