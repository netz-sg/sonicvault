import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { albums, artists, tracks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

function getLocalCoverUrl(albumId: string): string | null {
  const dataDir = process.env.DATA_PATH || path.resolve(process.cwd(), '..', 'data');
  const coverPath = path.join(dataDir, 'covers', `${albumId}.jpg`);
  return fs.existsSync(coverPath) ? `/api/covers/${albumId}` : null;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const album = db
      .select()
      .from(albums)
      .where(eq(albums.id, params.id))
      .get();

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const artist = album.artistId
      ? db.select().from(artists).where(eq(artists.id, album.artistId)).get()
      : null;

    const albumTracks = db
      .select()
      .from(tracks)
      .where(eq(tracks.albumId, params.id))
      .orderBy(tracks.discNumber, tracks.trackNumber)
      .all();

    // Use local high-res cover if cached, otherwise fall back to DB URLs
    const localCover = getLocalCoverUrl(params.id);

    return NextResponse.json({
      ...album,
      coverUrl: localCover || album.coverUrl,
      coverSmall: localCover || album.coverSmall,
      genres: album.genres ? JSON.parse(album.genres) : [],
      artist: artist
        ? { id: artist.id, name: artist.name, imageUrl: artist.imageUrl }
        : null,
      tracks: albumTracks,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch album';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
