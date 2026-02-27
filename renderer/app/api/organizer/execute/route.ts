import { NextResponse } from 'next/server';
import { executeOrganize, type OrganizeMode } from '@/lib/services/organizer';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!Array.isArray(body.operations) || body.operations.length === 0) {
      return NextResponse.json(
        { error: 'No operations provided. Use /api/organizer/preview first.' },
        { status: 400 },
      );
    }

    // Validate each operation
    const operations: Array<{
      trackId: string;
      sourcePath: string;
      targetPath: string;
      operation: OrganizeMode;
    }> = [];

    for (const op of body.operations) {
      if (!op.trackId || !op.sourcePath || !op.targetPath) {
        return NextResponse.json(
          { error: 'Each operation must have trackId, sourcePath, and targetPath' },
          { status: 400 },
        );
      }
      operations.push({
        trackId: op.trackId,
        sourcePath: op.sourcePath,
        targetPath: op.targetPath,
        operation: op.operation === 'move' ? 'move' : 'copy',
      });
    }

    const result = executeOrganize(operations);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Execution failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
