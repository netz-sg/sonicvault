import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const albumId = params.id;

    // Sanitize ID to prevent path traversal
    if (!/^[a-zA-Z0-9-]+$/.test(albumId)) {
      return new NextResponse(null, { status: 400 });
    }

    const dataDir = process.env.DATA_PATH || path.resolve(process.cwd(), '..', 'data');
    const coverPath = path.join(dataDir, 'covers', `${albumId}.jpg`);

    if (!fs.existsSync(coverPath)) {
      return new NextResponse(null, { status: 404 });
    }

    const buffer = fs.readFileSync(coverPath);
    const stat = fs.statSync(coverPath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(stat.size),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
