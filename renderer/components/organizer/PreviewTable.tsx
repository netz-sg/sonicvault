'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  AlertTriangle,
  Copy,
  MoveRight,
  Ban,
  ChevronDown,
  ChevronUp,
  FileAudio,
} from 'lucide-react';
import type { PreviewItem } from './types';

interface PreviewTableProps {
  items: PreviewItem[];
  onToggleSkip: (trackId: string) => void;
}

export function PreviewTable({ items, onToggleSkip }: PreviewTableProps) {
  const [expanded, setExpanded] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ready' | 'conflicts' | 'skipped'>('all');

  const filtered = items.filter((item) => {
    if (filter === 'ready') return !item.skip && !item.conflict;
    if (filter === 'conflicts') return !!item.conflict;
    if (filter === 'skipped') return item.skip;
    return true;
  });

  const readyCount = items.filter(i => !i.skip && !i.conflict).length;
  const conflictCount = items.filter(i => !!i.conflict).length;
  const skippedCount = items.filter(i => i.skip).length;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-secondary overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-tertiary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FileAudio className="w-5 h-5 text-accent" />
          <h3 className="text-sm font-medium text-foreground">
            Preview — {items.length} files
          </h3>
          <div className="flex items-center gap-2 ml-2">
            <StatusBadge label={`${readyCount} ready`} color="success" />
            {conflictCount > 0 && (
              <StatusBadge label={`${conflictCount} conflicts`} color="warning" />
            )}
            {skippedCount > 0 && (
              <StatusBadge label={`${skippedCount} skipped`} color="tertiary" />
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-foreground-tertiary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-foreground-tertiary" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 px-4 pb-3 border-b border-border-subtle">
              <FilterTab
                active={filter === 'all'}
                label={`All (${items.length})`}
                onClick={() => setFilter('all')}
              />
              <FilterTab
                active={filter === 'ready'}
                label={`Ready (${readyCount})`}
                onClick={() => setFilter('ready')}
              />
              <FilterTab
                active={filter === 'conflicts'}
                label={`Conflicts (${conflictCount})`}
                onClick={() => setFilter('conflicts')}
              />
              <FilterTab
                active={filter === 'skipped'}
                label={`Skipped (${skippedCount})`}
                onClick={() => setFilter('skipped')}
              />
            </div>

            {/* Table */}
            <div className="max-h-96 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-sm text-foreground-tertiary">
                  No items match the current filter.
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {filtered.map((item) => (
                    <PreviewRow
                      key={item.trackId}
                      item={item}
                      onToggleSkip={() => onToggleSkip(item.trackId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PreviewRow({
  item,
  onToggleSkip,
}: {
  item: PreviewItem;
  onToggleSkip: () => void;
}) {
  const isConflict = !!item.conflict;
  const OpIcon = item.operation === 'copy' ? Copy : MoveRight;

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-3 text-xs transition-colors ${
        item.skip ? 'opacity-50' : 'hover:bg-surface-tertiary/30'
      }`}
    >
      {/* Skip Toggle */}
      <button
        onClick={onToggleSkip}
        className="mt-0.5 shrink-0 w-4 h-4 rounded border border-border-subtle flex items-center justify-center
                   hover:border-accent/50 transition-colors"
        title={item.skip ? 'Include this file' : 'Skip this file'}
      >
        {item.skip && <Ban className="w-3 h-3 text-foreground-tertiary" />}
        {!item.skip && (
          <div className="w-2 h-2 rounded-sm bg-accent" />
        )}
      </button>

      {/* Operation Icon */}
      <OpIcon className={`mt-0.5 w-3.5 h-3.5 shrink-0 ${
        item.skip ? 'text-foreground-tertiary' : 'text-accent'
      }`} />

      {/* Paths */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-foreground-tertiary truncate block">
            {shortenPath(item.sourcePath)}
          </span>
          <ArrowRight className="w-3 h-3 shrink-0 text-foreground-tertiary" />
          <span className={`font-mono truncate block ${
            item.skip ? 'text-foreground-tertiary' : 'text-foreground'
          }`}>
            {shortenPath(item.targetPath)}
          </span>
        </div>

        {/* Conflict Badge */}
        {isConflict && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-warning" />
            <span className={`text-[11px] ${
              item.conflict!.type === 'unresolvable' ? 'text-error' : 'text-warning'
            }`}>
              {item.conflict!.type}: {item.conflict!.reason}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ label, color }: { label: string; color: 'success' | 'warning' | 'tertiary' }) {
  const colorMap = {
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    tertiary: 'bg-surface-tertiary text-foreground-tertiary',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${colorMap[color]}`}>
      {label}
    </span>
  );
}

function FilterTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
        active
          ? 'bg-accent/10 text-accent'
          : 'text-foreground-tertiary hover:text-foreground hover:bg-surface-tertiary'
      }`}
    >
      {label}
    </button>
  );
}

/** Shorten a long file path for display */
function shortenPath(fullPath: string): string {
  const parts = fullPath.replace(/\\/g, '/').split('/');
  if (parts.length <= 4) return parts.join('/');
  return `.../${parts.slice(-3).join('/')}`;
}
