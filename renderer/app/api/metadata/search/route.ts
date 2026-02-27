import { NextResponse } from 'next/server';
import { searchArtist } from '@/lib/api/musicbrainz';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, type = 'artist' } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: query' },
        { status: 400 }
      );
    }

    if (type === 'artist') {
      const results = await searchArtist(query, 10);
      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: `Unknown search type: ${type}` }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
