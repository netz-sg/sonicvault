'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Copy,
  MoveRight,
  Tag,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Undo2,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import type { FileOperation, HistoryResult } from './types';

interface OperationsHistoryProps {
  history: HistoryResult | undefined;
  page: number;
  onPageChange: (page: number) => void;
  onUndo: (ids: string[]) => void;
  isUndoing: boolean;
  isLoading: boolean;
}

const operationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  copy: Copy,
  move: MoveRight,
  tag_write: Tag,
  delete: Trash2,
  rename: MoveRight,
};

const operationLabels: Record<string, string> = {
  copy: 'Copy',
  move: 'Move',
  tag_write: 'Tag Write',
  delete: 'Delete',
  rename: 'Rename',
};

const statusColors: Record<string, string> = {
  completed: 'text-success',
  failed: 'text-error',
  undone: 'text-warning',
};

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  completed: CheckCircle2,
  failed: XCircle,
  undone: RotateCcw,
};

export function OperationsHistory({
  history,
  page,
  onPageChange,
  onUndo,
  isUndoing,
  isLoading,
}: OperationsHistoryProps) {
  const [expanded, setExpanded] = useState(false);

  const items = history?.items ?? [];
  const totalPages = history?.totalPages ?? 1;
  const total = history?.total ?? 0;

  return (
    <div
      className="rounded-xl border border-border-subtle overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #111115 0%, #0E0E12 100%)' }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between hover:bg-surface-tertiary/30 transition-colors"
        style={{ padding: '1rem' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="rounded-lg flex items-center justify-center shrink-0"
            style={{
              width: '2rem',
              height: '2rem',
              background: 'rgba(232,168,73,0.06)',
              border: '1px solid rgba(232,168,73,0.08)',
            }}
          >
            <History className="w-3.5 h-3.5 text-accent" />
          </div>
          <h3 className="text-sm font-medium text-foreground">
            Operations History
          </h3>
          {total > 0 && (
            <span
              className="font-mono text-[11px] tabular-nums text-foreground-tertiary"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                padding: '0.125rem 0.5rem',
                borderRadius: '9999px',
              }}
            >
              {total}
            </span>
          )}
        </div>
        <div
          className="rounded-lg flex items-center justify-center"
          style={{
            width: '1.75rem',
            height: '1.75rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-foreground-tertiary" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-foreground-tertiary" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              style={{
                height: '1px',
                background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent 100%)',
              }}
            />

            {isLoading ? (
              <div
                className="text-center text-sm text-foreground-tertiary"
                style={{ padding: '2rem 1rem' }}
              >
                Loading history...
              </div>
            ) : items.length === 0 ? (
              <div
                className="text-center text-sm text-foreground-tertiary"
                style={{ padding: '2rem 1rem' }}
              >
                No operations yet. Organize files to see history here.
              </div>
            ) : (
              <>
                {/* Operations List */}
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {items.map((op) => (
                    <OperationRow
                      key={op.id}
                      operation={op}
                      onUndo={() => onUndo([op.id])}
                      isUndoing={isUndoing}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    className="flex items-center justify-between border-t border-border-subtle"
                    style={{ padding: '0.75rem 1rem' }}
                  >
                    <span className="text-xs text-foreground-tertiary font-mono tabular-nums">
                      Page {page} of {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        className="rounded-lg flex items-center justify-center
                                   hover:bg-surface-tertiary transition-colors
                                   disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{
                          width: '1.75rem',
                          height: '1.75rem',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <ChevronLeft className="w-3.5 h-3.5 text-foreground-tertiary" />
                      </button>
                      <button
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        className="rounded-lg flex items-center justify-center
                                   hover:bg-surface-tertiary transition-colors
                                   disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{
                          width: '1.75rem',
                          height: '1.75rem',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-foreground-tertiary" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OperationRow({
  operation,
  onUndo,
  isUndoing,
}: {
  operation: FileOperation;
  onUndo: () => void;
  isUndoing: boolean;
}) {
  const OpIcon = operationIcons[operation.operation] ?? MoveRight;
  const StatusIcon = statusIcons[operation.status] ?? CheckCircle2;
  const canUndo = operation.status === 'completed';

  const timeStr = operation.createdAt
    ? new Date(operation.createdAt).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      className="group flex items-center gap-3 hover:bg-surface-tertiary/20 transition-colors"
      style={{ padding: '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
    >
      {/* Operation Icon */}
      <div
        className="rounded flex items-center justify-center shrink-0"
        style={{
          width: '1.5rem',
          height: '1.5rem',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <OpIcon className="w-3 h-3 text-foreground-tertiary" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">
            {operationLabels[operation.operation] ?? operation.operation}
          </span>
          <StatusIcon className={`w-3 h-3 ${statusColors[operation.status] ?? 'text-foreground-tertiary'}`} />
          <span className="text-[11px] text-foreground-tertiary font-mono tabular-nums">{timeStr}</span>
        </div>
        <p className="text-[11px] font-mono text-foreground-tertiary truncate mt-0.5">
          {shortenPath(operation.sourcePath)}
          {operation.targetPath && (
            <>
              {' → '}
              {shortenPath(operation.targetPath)}
            </>
          )}
        </p>
      </div>

      {/* Undo button */}
      {canUndo && (
        <button
          onClick={onUndo}
          disabled={isUndoing}
          className="shrink-0 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center
                     hover:bg-warning/10 text-foreground-tertiary hover:text-warning
                     transition-all duration-200 disabled:opacity-40"
          style={{
            width: '1.75rem',
            height: '1.75rem',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          title="Undo this operation"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function shortenPath(fullPath: string): string {
  const parts = fullPath.replace(/\\/g, '/').split('/');
  if (parts.length <= 3) return parts.join('/');
  return `.../${parts.slice(-2).join('/')}`;
}
