'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  SkipForward,
  AlertCircle,
  Undo2,
} from 'lucide-react';
import type { ExecuteResult, UndoResult } from './types';

interface ExecuteResultsProps {
  result: ExecuteResult | null;
  undoResult: UndoResult | null;
  operationIds: string[];
  onUndo: (ids: string[]) => void;
  isUndoing: boolean;
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
};

export function ExecuteResults({
  result,
  undoResult,
  operationIds,
  onUndo,
  isUndoing,
}: ExecuteResultsProps) {
  if (!result && !undoResult) return null;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col"
      style={{ gap: '1rem' }}
    >
      {/* Execute Result */}
      {result && (
        <>
          {/* Summary Banner */}
          <motion.div
            variants={fadeUp}
            className={`relative rounded-xl border overflow-hidden ${
              result.completed > 0
                ? 'border-success/20'
                : 'border-border-subtle'
            }`}
            style={{
              background: 'linear-gradient(180deg, #111115 0%, #0E0E12 100%)',
              padding: '1.25rem',
            }}
          >
            {result.completed > 0 && (
              <div
                className="absolute left-0 top-0 bottom-0"
                style={{
                  width: '3px',
                  background: 'linear-gradient(to bottom, rgba(34,197,94,0.5) 0%, rgba(34,197,94,0.1) 100%)',
                }}
              />
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    width: '2.25rem',
                    height: '2.25rem',
                    background: result.completed > 0 ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)',
                    border: result.completed > 0 ? '1px solid rgba(34,197,94,0.1)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <CheckCircle2
                    className={`w-4 h-4 ${result.completed > 0 ? 'text-success' : 'text-foreground-tertiary'}`}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    Organization complete
                  </h3>
                  <p className="text-xs text-foreground-secondary mt-0.5">
                    <span className="font-mono tabular-nums">{result.completed}</span> file{result.completed !== 1 ? 's' : ''} organized successfully
                  </p>
                </div>
              </div>

              {/* Undo Button */}
              {operationIds.length > 0 && (
                <button
                  onClick={() => onUndo(operationIds)}
                  disabled={isUndoing}
                  className="inline-flex items-center gap-1.5 h-8 rounded-lg text-xs font-medium
                             bg-surface-tertiary text-foreground border border-border-subtle
                             hover:border-warning/30 hover:text-warning transition-all duration-200
                             disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ padding: '0 0.75rem' }}
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  {isUndoing ? 'Undoing...' : 'Undo All'}
                </button>
              )}
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
            <StatCard
              icon={CheckCircle2}
              label="Completed"
              value={result.completed}
              accent={result.completed > 0}
            />
            <StatCard
              icon={SkipForward}
              label="Skipped"
              value={result.skipped}
              accent={false}
            />
            <StatCard
              icon={XCircle}
              label="Failed"
              value={result.failed}
              accent={false}
              error={result.failed > 0}
            />
          </motion.div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <motion.div
              variants={fadeUp}
              className="relative rounded-xl border border-error/20 overflow-hidden"
              style={{ background: 'rgba(239,68,68,0.03)', padding: '1.25rem' }}
            >
              <div
                className="absolute left-0 top-0 bottom-0"
                style={{
                  width: '3px',
                  background: 'linear-gradient(to bottom, rgba(239,68,68,0.5) 0%, rgba(239,68,68,0.1) 100%)',
                }}
              />
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-error" />
                <h4 className="text-sm font-medium text-error">
                  {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}
                </h4>
              </div>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                {result.errors.map((err, i) => (
                  <div key={i} className="text-xs text-foreground-secondary">
                    <span className="font-mono text-foreground-tertiary">
                      {err.trackId.slice(0, 8)}...
                    </span>{' '}
                    <span className="text-error/80">{err.error}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Undo Result */}
      {undoResult && (
        <motion.div
          variants={fadeUp}
          className={`relative rounded-xl border overflow-hidden ${
            undoResult.undone > 0
              ? 'border-warning/20'
              : 'border-border-subtle'
          }`}
          style={{
            background: 'linear-gradient(180deg, #111115 0%, #0E0E12 100%)',
            padding: '1.25rem',
          }}
        >
          {undoResult.undone > 0 && (
            <div
              className="absolute left-0 top-0 bottom-0"
              style={{
                width: '3px',
                background: 'linear-gradient(to bottom, rgba(234,179,8,0.5) 0%, rgba(234,179,8,0.1) 100%)',
              }}
            />
          )}
          <div className="flex items-center gap-3">
            <div
              className="rounded-lg flex items-center justify-center shrink-0"
              style={{
                width: '2.25rem',
                height: '2.25rem',
                background: undoResult.undone > 0 ? 'rgba(234,179,8,0.06)' : 'rgba(255,255,255,0.03)',
                border: undoResult.undone > 0 ? '1px solid rgba(234,179,8,0.1)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <Undo2 className={`w-4 h-4 ${undoResult.undone > 0 ? 'text-warning' : 'text-foreground-tertiary'}`} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Undo complete</h3>
              <p className="text-xs text-foreground-secondary mt-0.5">
                <span className="font-mono tabular-nums">{undoResult.undone}</span> operation{undoResult.undone !== 1 ? 's' : ''} reversed
                {undoResult.failed > 0 && (
                  <>, <span className="font-mono tabular-nums">{undoResult.failed}</span> failed</>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  error,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: boolean;
  error?: boolean;
}) {
  return (
    <div
      className="rounded-xl border border-border-subtle"
      style={{ background: 'linear-gradient(180deg, #111115 0%, #0E0E12 100%)', padding: '1rem' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="rounded flex items-center justify-center"
          style={{
            width: '1.5rem',
            height: '1.5rem',
            background: error ? 'rgba(239,68,68,0.06)' : accent ? 'rgba(232,168,73,0.06)' : 'rgba(255,255,255,0.03)',
            border: error ? '1px solid rgba(239,68,68,0.08)' : accent ? '1px solid rgba(232,168,73,0.08)' : '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Icon className={`w-3 h-3 ${
            error ? 'text-error' : accent ? 'text-accent/60' : 'text-foreground-tertiary'
          }`} />
        </div>
        <span className="text-xs text-foreground-tertiary">{label}</span>
      </div>
      <p className={`text-2xl font-mono font-semibold tabular-nums ${
        error ? 'text-error' : accent ? 'text-accent' : 'text-foreground'
      }`}>
        {value}
      </p>
    </div>
  );
}
