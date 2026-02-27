import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { albums, artists } from '@/lib/db/schema';
import { eq, sql, like } from 'drizzle-orm';
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
    const search = searchParams.get('search') || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '50')));
    const offset = (page - 1) * limit;

    let query = db.select().from(albums);

    if (search) {
      query = query.where(like(albums.title, `%${search}%`)) as typeof query;
    }

    const items = query
      .orderBy(albums.title)
      .limit(limit)
      .offset(offset)
      .all();

    let countQuery = db.select({ count: sql<number>`count(*)` }).from(albums);
    if (search) {
      countQuery = countQuery.where(like(albums.title, `%${search}%`)) as typeof countQuery;
    }
    const [{ count: total }] = countQuery.all();

    // Enrich with artist name and local cover
    const enriched = items.map((album) => {
      const artist = album.artistId
        ? db.select({ name: artists.name }).from(artists).where(eq(artists.id, album.artistId)).get()
        : null;

      const localCover = getLocalCoverUrl(album.id);

      return {
        ...album,
        coverUrl: localCover || album.coverUrl,
        coverSmall: localCover || album.coverSmall,
        genres: album.genres ? JSON.parse(album.genres) : [],
        artistName: artist?.name ?? 'Unknown Artist',
      };
    });

    return NextResponse.json({
      items: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch albums';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
