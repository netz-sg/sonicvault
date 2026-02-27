import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const rows = db.select().from(settings).all();
    const result: Record<string, string> = {};
    for (const row of rows) {
      if (row.key && row.value !== null) {
        result[row.key] = row.value;
      }
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Invalid settings object' }, { status: 400 });
    }

    const validKeys = new Set([
      'library_path',
      'naming_pattern_artist',
      'naming_pattern_album',
      'naming_pattern_track',
      'organize_mode',
      'auto_tag_write',
      'handle_duplicates',
      'cover_embed',
      'nfo_generate',
      'metadata_language',
      'auto_watch_enabled',
      'auto_watch_interval',
      'onboarding_completed',
      'ui_language',
    ]);

    const updated: string[] = [];

    for (const [key, value] of Object.entries(body)) {
      if (!validKeys.has(key)) continue;
      const strValue = String(value);

      const existing = db.select().from(settings).where(eq(settings.key, key)).get();
      if (existing) {
        db.update(settings).set({ value: strValue }).where(eq(settings.key, key)).run();
      } else {
        db.insert(settings).values({ key, value: strValue }).run();
      }
      updated.push(key);
    }

    // Return all settings after update
    const rows = db.select().from(settings).all();
    const result: Record<string, string> = {};
    for (const row of rows) {
      if (row.key && row.value !== null) {
        result[row.key] = row.value;
      }
    }

    return NextResponse.json({ updated, settings: result });
  } catch (error) {
    console.error('[Settings PUT] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
