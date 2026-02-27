import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { autoWatcher } from '@/lib/services/auto-watcher';

/**
 * GET /api/auto-watch — Current watcher status
 */
export async function GET() {
  return NextResponse.json(autoWatcher.getStatus());
}

/**
 * POST /api/auto-watch — Toggle watcher on/off
 * Body: { enabled: boolean, intervalMinutes?: number }
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { enabled, intervalMinutes } = body;

  if (typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 400 });
  }

  const interval = typeof intervalMinutes === 'number' && intervalMinutes >= 1
    ? intervalMinutes
    : 5;

  // Persist settings
  db.insert(settings)
    .values({ key: 'auto_watch_enabled', value: enabled ? 'true' : 'false' })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: enabled ? 'true' : 'false' },
    })
    .run();

  db.insert(settings)
    .values({ key: 'auto_watch_interval', value: String(interval) })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: String(interval) },
    })
    .run();

  // Start or stop watcher
  if (enabled) {
    autoWatcher.start(interval);
  } else {
    autoWatcher.stop();
  }

  return NextResponse.json(autoWatcher.getStatus());
}
