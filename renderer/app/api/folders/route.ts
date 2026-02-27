import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sourceFolders } from '@/lib/db/schema';
import { v4 as uuid } from 'uuid';
import fs from 'fs';

// ── List all source folders ──
export async function GET() {
  try {
    const folders = db.select().from(sourceFolders).all();
    return NextResponse.json(folders);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list folders';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Add a new source folder ──
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { path: folderPath, label } = body;

    if (!folderPath || typeof folderPath !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: path' },
        { status: 400 }
      );
    }

    // Validate path exists and is a directory
    if (!fs.existsSync(folderPath)) {
      return NextResponse.json(
        { error: `Path does not exist: ${folderPath}` },
        { status: 400 }
      );
    }

    const stat = fs.statSync(folderPath);
    if (!stat.isDirectory()) {
      return NextResponse.json(
        { error: `Path is not a directory: ${folderPath}` },
        { status: 400 }
      );
    }

    const now = Date.now();
    const folder = {
      id: uuid(),
      path: folderPath,
      label: label || folderPath.split(/[/\\]/).pop() || folderPath,
      autoScan: 0,
      autoOrganize: 0,
      createdAt: now,
      updatedAt: now,
    };

    db.insert(sourceFolders).values(folder).run();

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      return NextResponse.json(
        { error: 'This folder is already added' },
        { status: 409 }
      );
    }
    const message = error instanceof Error ? error.message : 'Failed to add folder';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
