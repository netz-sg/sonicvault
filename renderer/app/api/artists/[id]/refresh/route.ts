import { NextResponse } from 'next/server';
import { enrichArtist } from '@/lib/services/enrichment';
import { db } from '@/lib/db';
import { artists } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Reset status to pending so enrichment re-runs
    db.update(artists)
      .set({ metadataStatus: 'pending', updatedAt: Date.now() })
      .where(eq(artists.id, params.id))
      .run();

    const success = await enrichArtist(params.id);

    const artist = db
      .select()
      .from(artists)
      .where(eq(artists.id, params.id))
      .get();

    return NextResponse.json({
      success,
      artist: artist
        ? {
            ...artist,
            genres: artist.genres ? JSON.parse(artist.genres) : [],
            tags: artist.tags ? JSON.parse(artist.tags) : [],
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Refresh failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
