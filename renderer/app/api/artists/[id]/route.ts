import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { artists, albums, tracks } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
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
    const artist = db
      .select()
      .from(artists)
      .where(eq(artists.id, params.id))
      .get();

    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    // Get albums with track counts
    const artistAlbums = db
      .select()
      .from(albums)
      .where(eq(albums.artistId, params.id))
      .orderBy(albums.releaseDate)
      .all();

    const enrichedAlbums = artistAlbums.map((album) => {
      const [trackCount] = db
        .select({ count: sql<number>`count(*)` })
        .from(tracks)
        .where(eq(tracks.albumId, album.id))
        .all();

      const localCover = getLocalCoverUrl(album.id);

      return {
        ...album,
        coverUrl: localCover || album.coverUrl,
        coverSmall: localCover || album.coverSmall,
        genres: album.genres ? JSON.parse(album.genres) : [],
        trackCount: trackCount?.count ?? album.trackCount ?? 0,
      };
    });

    return NextResponse.json({
      ...artist,
      genres: artist.genres ? JSON.parse(artist.genres) : [],
      tags: artist.tags ? JSON.parse(artist.tags) : [],
      albums: enrichedAlbums,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch artist';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
