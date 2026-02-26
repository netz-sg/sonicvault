// ═══════════════════════════════════════════════════════
// File Organizer — Shared Types
// ═══════════════════════════════════════════════════════

export type OrganizeMode = 'copy' | 'move';
export type DuplicateStrategy = 'skip' | 'overwrite' | 'keep_both';
export type ConflictType = 'duplicate' | 'collision' | 'unresolvable';

export interface PreviewItem {
  trackId: string;
  sourcePath: string;
  targetPath: string;
  operation: OrganizeMode;
  conflict?: {
    type: ConflictType;
    reason: string;
  };
  skip: boolean;
}

export interface PreviewResult {
  items: PreviewItem[];
  totalTracks: number;
  conflicts: number;
  skipped: number;
  ready: number;
}

export interface ExecuteResult {
  completed: number;
  failed: number;
  skipped: number;
  operationIds: string[];
  errors: Array<{ trackId: string; error: string }>;
}

export interface UndoResult {
  undone: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

export interface FileOperation {
  id: string;
  trackId: string | null;
  operation: string;
  sourcePath: string;
  targetPath: string | null;
  details: string | null;
  status: string;
  createdAt: number;
  updatedAt: number;
}

export interface HistoryResult {
  items: FileOperation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
