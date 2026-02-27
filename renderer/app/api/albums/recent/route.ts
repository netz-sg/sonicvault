import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { albums, artists } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

function getLocalCoverUrl(albumId: string): string | null {
  const dataDir = process.env.DATA_PATH || path.resolve(process.cwd(), '..', 'data');
  const coverPath = path.join(dataDir, 'covers', `${albumId}.jpg`);
  return fs.existsSync(coverPath) ? `/api/covers/${albumId}` : null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(20, Math.max(1, Number(searchParams.get('limit') || '8')));

    const items = db
      .select()
      .from(albums)
      .orderBy(desc(albums.createdAt))
      .limit(limit)
      .all();

    const enriched = items.map((album) => {
      const artist = album.artistId
        ? db.select({ name: artists.name, imageUrl: artists.imageUrl }).from(artists).where(eq(artists.id, album.artistId)).get()
        : null;

      const localCover = getLocalCoverUrl(album.id);

      return {
        id: album.id,
        title: album.title,
        releaseDate: album.releaseDate,
        coverUrl: localCover || album.coverUrl,
        coverSmall: localCover || album.coverSmall,
        artistName: artist?.name ?? 'Unknown Artist',
        artistImageUrl: artist?.imageUrl ?? null,
        genres: album.genres ? JSON.parse(album.genres) : [],
        createdAt: album.createdAt,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch recent albums';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
