import { NextResponse } from 'next/server';
import { generatePreview } from '@/lib/services/organizer';
import { db } from '@/lib/db';
import { tracks, settings } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const trackIds = Array.isArray(body.trackIds) ? body.trackIds : undefined;

    // Check prerequisites before generating preview
    const libraryPathRow = db.select().from(settings).where(eq(settings.key, 'library_path')).get();
    const libraryPath = libraryPathRow?.value || '';

    if (!libraryPath) {
      return NextResponse.json({
        error: 'Library path not configured. Go to Settings and set your library path first.',
      }, { status: 400 });
    }

    const [trackCount] = db.select({ count: sql<number>`count(*)` }).from(tracks).all();
    if ((trackCount?.count ?? 0) === 0 && !trackIds) {
      return NextResponse.json({
        error: 'No tracks in library. Scan your music folders first.',
      }, { status: 400 });
    }

    const preview = generatePreview(trackIds);

    return NextResponse.json(preview);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Preview generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
