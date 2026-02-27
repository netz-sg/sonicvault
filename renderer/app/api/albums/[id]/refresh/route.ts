import { NextResponse } from 'next/server';
import { enrichAlbum } from '@/lib/services/enrichment';
import { db } from '@/lib/db';
import { albums } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    db.update(albums)
      .set({ metadataStatus: 'pending', updatedAt: Date.now() })
      .where(eq(albums.id, params.id))
      .run();

    const success = await enrichAlbum(params.id);

    const album = db
      .select()
      .from(albums)
      .where(eq(albums.id, params.id))
      .get();

    return NextResponse.json({
      success,
      album: album
        ? { ...album, genres: album.genres ? JSON.parse(album.genres) : [] }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Refresh failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
