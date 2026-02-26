// AcoustID API Client — Placeholder for future implementation
// Not included in MVP scope, but interface is prepared.

export interface AcoustIDResult {
  id: string;
  score: number;
  recordings?: Array<{
    id: string;
    title: string;
    artists?: Array<{ id: string; name: string }>;
    releasegroups?: Array<{ id: string; title: string; type: string }>;
  }>;
}

export function isAcoustIDConfigured(): boolean {
  return !!process.env.ACOUSTID_API_KEY;
}

// Stub — requires fpcalc binary (Chromaprint) which is out of MVP scope
export async function lookupFingerprint(
  _fingerprint: string,
  _duration: number
): Promise<AcoustIDResult[]> {
  console.warn('[AcoustID] Not implemented in MVP. Requires fpcalc binary.');
  return [];
}
