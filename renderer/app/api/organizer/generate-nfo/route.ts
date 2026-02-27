import { NextResponse } from 'next/server';
import { generateAllNfos } from '@/lib/services/organizer/nfo-generator';

export async function POST() {
  try {
    const result = await generateAllNfos();

    return NextResponse.json({
      artistNfos: result.artistNfos,
      albumNfos: result.albumNfos,
      coversCopied: result.coversCopied,
      lyricsFiles: result.lyricsFiles,
      errors: result.errors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate NFO files';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
