'use client';

import { Sparkles, Play, Loader2 } from 'lucide-react';
import type { DuplicateStrategy } from './types';

interface OrganizeToolbarProps {
  duplicateStrategy: DuplicateStrategy;
  onDuplicateStrategyChange: (strategy: DuplicateStrategy) => void;
  onEnrich: () => void;
  onOrganizeAll: () => void;
  isEnriching: boolean;
  isOrganizing: boolean;
  pendingEnrichment: number;
  trackCount: number;
}

export function OrganizeToolbar({
  duplicateStrategy,
  onDuplicateStrategyChange,
  onEnrich,
  onOrganizeAll,
  isEnriching,
  isOrganizing,
  pendingEnrichment,
  trackCount,
}: OrganizeToolbarProps) {
  const isBusy = isEnriching || isOrganizing;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-secondary p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Duplicate Strategy */}
        <div className="space-y-1.5">
          <label className="text-xs text-foreground-tertiary font-medium uppercase tracking-wider">
            Duplicates
          </label>
          <select
            value={duplicateStrategy}
            onChange={(e) => onDuplicateStrategyChange(e.target.value as DuplicateStrategy)}
            disabled={isBusy}
            className="h-9 rounded-lg bg-surface-tertiary border border-border-subtle px-3 text-sm text-foreground
                       focus:outline-none focus:ring-1 focus:ring-accent/50 cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="skip">Skip existing</option>
            <option value="overwrite">Overwrite</option>
            <option value="keep_both">Keep both</option>
          </select>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Enrich */}
          <button
            onClick={onEnrich}
            disabled={isBusy || pendingEnrichment === 0}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium
                       bg-accent/10 text-accent border border-accent/20
                       hover:bg-accent/20 hover:border-accent/40 transition-all duration-200
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEnriching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isEnriching ? 'Enriching...' : pendingEnrichment > 0 ? `Enrich ${pendingEnrichment}` : 'Enrich'}
          </button>

          {/* Organize All */}
          <button
            onClick={onOrganizeAll}
            disabled={isBusy || trackCount === 0}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-medium
                       bg-accent text-surface border border-accent
                       hover:bg-accent-dark transition-all duration-200
                       disabled:opacity-40 disabled:cursor-not-allowed
                       shadow-[0_0_12px_var(--accent-glow)]"
          >
            {isOrganizing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isOrganizing ? 'Organizing...' : `Organize ${trackCount} tracks`}
          </button>
        </div>
      </div>
    </div>
  );
}
