import { NextResponse } from 'next/server';
import { enrichAll } from '@/lib/services/enrichment';

export async function POST() {
  try {
    const progress = await enrichAll();
    return NextResponse.json(progress);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Enrichment failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
