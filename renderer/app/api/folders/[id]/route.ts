import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sourceFolders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// ── Update a source folder (autoScan, autoOrganize, label) ──
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existing = db
      .select()
      .from(sourceFolders)
      .where(eq(sourceFolders.id, params.id))
      .get();

    if (!existing) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (typeof body.autoScan === 'boolean') {
      updates.autoScan = body.autoScan ? 1 : 0;
    }
    if (typeof body.autoOrganize === 'boolean') {
      updates.autoOrganize = body.autoOrganize ? 1 : 0;
    }
    if (typeof body.label === 'string') {
      updates.label = body.label;
    }

    db.update(sourceFolders)
      .set(updates)
      .where(eq(sourceFolders.id, params.id))
      .run();

    const updated = db
      .select()
      .from(sourceFolders)
      .where(eq(sourceFolders.id, params.id))
      .get();

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update folder';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Delete a source folder ──
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existing = db
      .select()
      .from(sourceFolders)
      .where(eq(sourceFolders.id, params.id))
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    db.delete(sourceFolders).where(eq(sourceFolders.id, params.id)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete folder';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
