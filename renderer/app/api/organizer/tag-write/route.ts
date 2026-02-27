import { NextResponse } from 'next/server';
import { batchTagWrite } from '@/lib/services/organizer/tag-writer';
import { db } from '@/lib/db';
import { tracks } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    let trackIds: string[] = [];

    if (Array.isArray(body.trackIds) && body.trackIds.length > 0) {
      trackIds = body.trackIds;
    } else {
      // No trackIds provided — write tags for ALL tracks with a file path
      const allTracks = db.select({ id: tracks.id })
        .from(tracks)
        .where(sql`${tracks.filePath} IS NOT NULL`)
        .all();
      trackIds = allTracks.map(t => t.id);
    }

    if (trackIds.length === 0) {
      return NextResponse.json(
        { error: 'No tracks found in library. Scan your music first.' },
        { status: 400 },
      );
    }

    const results = batchTagWrite(trackIds);

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      results,
      summary: { total: results.length, succeeded, failed },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tag writing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
