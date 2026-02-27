import { NextResponse } from 'next/server';
import { getLibraryStats } from '@/lib/services/scanner';

export async function GET() {
  try {
    const stats = getLibraryStats();
    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
