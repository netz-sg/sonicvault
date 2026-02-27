import { NextResponse } from 'next/server';
import { undoOperations } from '@/lib/services/organizer';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!Array.isArray(body.operationIds) || body.operationIds.length === 0) {
      return NextResponse.json(
        { error: 'No operation IDs provided' },
        { status: 400 },
      );
    }

    const result = undoOperations(body.operationIds);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Undo failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
