'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Trash2, ScanSearch, Loader2, Eye, ArrowRightLeft } from 'lucide-react';
import type { SourceFolder } from '@/components/scanner/types';

interface FolderListProps {
  folders: SourceFolder[];
  scanningFolderId?: string | null;
  onScan?: (folderId: string) => void;
  onDelete?: (folderId: string) => void;
  onToggleAutoScan?: (folderId: string, enabled: boolean) => void;
  onToggleAutoOrganize?: (folderId: string, enabled: boolean) => void;
  emptyMessage?: string;
  emptySubMessage?: string;
}

export function FolderList({
  folders,
  scanningFolderId,
  onScan,
  onDelete,
  onToggleAutoScan,
  onToggleAutoOrganize,
  emptyMessage = 'No source folders added yet',
  emptySubMessage = 'Add a folder to get started',
}: FolderListProps) {
  if (folders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center">
        <FolderOpen className="w-8 h-8 text-foreground-tertiary mx-auto mb-3" />
        <p className="text-sm text-foreground-secondary">{emptyMessage}</p>
        <p className="text-xs text-foreground-tertiary mt-1">
          {emptySubMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {folders.map((folder) => {
          const isScanning = scanningFolderId === folder.id;
          const autoScanOn = folder.autoScan === 1;
          const autoOrganizeOn = folder.autoOrganize === 1;

          return (
            <motion.div
              key={folder.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="group rounded-xl border border-border-subtle bg-surface-secondary hover:border-accent/15 transition-colors"
            >
              {/* Main row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-lg bg-surface-tertiary flex items-center justify-center shrink-0">
                  <FolderOpen className="w-4 h-4 text-foreground-secondary" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {folder.label || folder.path}
                  </p>
                  <p className="text-xs font-mono text-foreground-tertiary truncate mt-0.5">
                    {folder.path}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onScan && (
                    <button
                      onClick={() => onScan(folder.id)}
                      disabled={isScanning}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
                    >
                      {isScanning ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ScanSearch className="w-3.5 h-3.5" />
                      )}
                      {isScanning ? 'Scanning...' : 'Scan'}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(folder.id)}
                      disabled={isScanning}
                      className="p-1.5 rounded-lg text-foreground-tertiary hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Auto-Watch toggles */}
              {(onToggleAutoScan || onToggleAutoOrganize) && (
                <div className="flex items-center gap-4 px-5 pb-3 pt-0">
                  {onToggleAutoScan && (
                    <MiniToggle
                      icon={Eye}
                      label="Auto-Scan"
                      active={autoScanOn}
                      onClick={() => onToggleAutoScan(folder.id, !autoScanOn)}
                    />
                  )}
                  {onToggleAutoOrganize && (
                    <MiniToggle
                      icon={ArrowRightLeft}
                      label="Auto-Organize"
                      active={autoOrganizeOn}
                      onClick={() => onToggleAutoOrganize(folder.id, !autoOrganizeOn)}
                    />
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function MiniToggle({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
        active
          ? 'bg-accent/15 text-accent border border-accent/25'
          : 'bg-surface-tertiary/50 text-foreground-tertiary border border-transparent hover:text-foreground-secondary hover:border-border-subtle'
      }`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}
