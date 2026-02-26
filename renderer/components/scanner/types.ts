export interface ScanResult {
  totalFiles: number;
  audioFiles: number;
  newArtists: number;
  newAlbums: number;
  newTracks: number;
  skipped: number;
  errors: Array<{ file: string; error: string }>;
}

export interface SourceFolder {
  id: string;
  path: string;
  label: string | null;
  autoScan: number | null;
  autoOrganize: number | null;
  createdAt: number | null;
  updatedAt: number | null;
}
