import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getDataDir } from '@/lib/db/index';
import { tracks, albums, artists, fileOperations } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    // Delete data tables in order (foreign key constraints)
    const opCount = db.delete(fileOperations).run();
    const trackCount = db.delete(tracks).run();
    const albumCount = db.delete(albums).run();
    const artistCount = db.delete(artists).run();

    // Clean up cached image files
    const dataDir = getDataDir();
    let coverFiles = 0;
    let artistFiles = 0;

    const coversDir = path.join(dataDir, 'covers');
    if (fs.existsSync(coversDir)) {
      const files = fs.readdirSync(coversDir);
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(coversDir, file));
          coverFiles++;
        } catch { /* ignore */ }
      }
    }

    const artistsDir = path.join(dataDir, 'artists');
    if (fs.existsSync(artistsDir)) {
      const files = fs.readdirSync(artistsDir);
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(artistsDir, file));
          artistFiles++;
        } catch { /* ignore */ }
      }
    }

    return NextResponse.json({
      success: true,
      deleted: {
        tracks: trackCount.changes,
        albums: albumCount.changes,
        artists: artistCount.changes,
        operations: opCount.changes,
        coverFiles,
        artistFiles,
      },
    });
  } catch (error) {
    console.error('[Reset] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to reset library';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
