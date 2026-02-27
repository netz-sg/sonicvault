import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { artists, albums, tracks } from '@/lib/db/schema';
import { eq, sql, like } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '50')));
    const offset = (page - 1) * limit;

    let query = db.select().from(artists);

    if (search) {
      query = query.where(like(artists.name, `%${search}%`)) as typeof query;
    }

    const items = query
      .orderBy(artists.name)
      .limit(limit)
      .offset(offset)
      .all();

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(artists);
    if (search) {
      countQuery = countQuery.where(like(artists.name, `%${search}%`)) as typeof countQuery;
    }
    const [{ count: total }] = countQuery.all();

    // Get album counts per artist
    const enriched = items.map((artist) => {
      const [albumCount] = db
        .select({ count: sql<number>`count(*)` })
        .from(albums)
        .where(eq(albums.artistId, artist.id))
        .all();
      const [trackCount] = db
        .select({ count: sql<number>`count(*)` })
        .from(tracks)
        .where(eq(tracks.artistId, artist.id))
        .all();

      return {
        ...artist,
        genres: artist.genres ? JSON.parse(artist.genres) : [],
        tags: artist.tags ? JSON.parse(artist.tags) : [],
        albumCount: albumCount?.count ?? 0,
        trackCount: trackCount?.count ?? 0,
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
    const message = error instanceof Error ? error.message : 'Failed to fetch artists';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
