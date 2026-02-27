import { NextResponse } from 'next/server';
import { scanDirectory } from '@/lib/services/scanner';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { path: dirPath } = body;

    if (!dirPath || typeof dirPath !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: path' },
        { status: 400 }
      );
    }

    const result = await scanDirectory(dirPath);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scan failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
