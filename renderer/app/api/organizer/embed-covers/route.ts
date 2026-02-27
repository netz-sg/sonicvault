import { NextResponse } from 'next/server';
import { batchEmbedCovers, copyCoversToAlbumFolders } from '@/lib/services/organizer/tag-writer';
import { db } from '@/lib/db';
import { tracks } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const response: Record<string, unknown> = {};

    // Determine track IDs: use provided ones or fall back to all tracks
    let trackIds: string[] = [];
    if (Array.isArray(body.trackIds) && body.trackIds.length > 0) {
      trackIds = body.trackIds;
    } else {
      const allTracks = db.select({ id: tracks.id })
        .from(tracks)
        .where(sql`${tracks.filePath} IS NOT NULL`)
        .all();
      trackIds = allTracks.map(t => t.id);
    }

    // Embed covers into audio files
    if (trackIds.length > 0) {
      const results = batchEmbedCovers(trackIds);
      const succeeded = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      response.embed = {
        results,
        summary: { total: results.length, succeeded, failed },
      };
    }

    // Copy cover.jpg to album folders
    if (body.copyToFolders !== false) {
      const albumIds = Array.isArray(body.albumIds) ? body.albumIds : undefined;
      const folderResult = copyCoversToAlbumFolders(albumIds);
      response.folders = folderResult;
    }

    if (!response.embed && !response.folders) {
      return NextResponse.json(
        { error: 'No tracks found in library. Scan your music first.' },
        { status: 400 },
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cover embedding failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
