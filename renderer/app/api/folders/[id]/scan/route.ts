import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sourceFolders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { scanDirectory } from '@/lib/services/scanner';

// ── Scan a specific source folder ──
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const folder = db
      .select()
      .from(sourceFolders)
      .where(eq(sourceFolders.id, params.id))
      .get();

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    const result = await scanDirectory(folder.path);

    // Update folder's updatedAt
    db.update(sourceFolders)
      .set({ updatedAt: Date.now() })
      .where(eq(sourceFolders.id, params.id))
      .run();

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scan failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
