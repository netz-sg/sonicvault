'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, Settings, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { OrganizeToolbar } from '@/components/organizer/OrganizeToolbar';
import { ExecuteProgress } from '@/components/organizer/ExecuteProgress';
import { ExecuteResults } from '@/components/organizer/ExecuteResults';
import { OperationsHistory } from '@/components/organizer/OperationsHistory';
import type {
  DuplicateStrategy,
  PreviewResult,
  ExecuteResult,
  UndoResult,
  HistoryResult,
} from '@/components/organizer/types';
import type { OrganizeStepId } from '@/components/organizer/ExecuteProgress';

export function OrganizeSection() {
  const queryClient = useQueryClient();

  // -- State --
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('skip');
  const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(null);
  const [undoResult, setUndoResult] = useState<UndoResult | null>(null);
  const [lastOperationIds, setLastOperationIds] = useState<string[]>([]);
  const [historyPage, setHistoryPage] = useState(1);

  // Organize All pipeline state
  const [organizeStep, setOrganizeStep] = useState<OrganizeStepId | 'done' | null>(null);
  const [organizeResults, setOrganizeResults] = useState<{
    moved: number;
    tagged: number;
    covers: number;
    nfos: number;
    lyrics: number;
    errors: string[];
  } | null>(null);

  // -- Fetch library stats --
  const { data: stats } = useQuery<{
    totalTracks: number;
    pending: number;
    artists: number;
    albums: number;
    enrichedArtists: number;
    enrichedAlbums: number;
    enrichedTracks: number;
  }>({
    queryKey: ['stats'],
    queryFn: () => fetch('/api/library/stats').then((r) => r.json()),
  });

  // -- Fetch settings --
  const { data: settingsData } = useQuery<Record<string, string>>({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then((r) => r.json()),
  });

  // -- Fetch history --
  const { data: history, isLoading: historyLoading } = useQuery<HistoryResult>({
    queryKey: ['organizer-history', historyPage],
    queryFn: () => fetch(`/api/organizer/history?page=${historyPage}&limit=20`).then((r) => r.json()),
  });

  // -- Sync duplicate strategy from settings --
  useEffect(() => {
    if (settingsData?.handle_duplicates) {
      setDuplicateStrategy(settingsData.handle_duplicates as DuplicateStrategy);
    }
  }, [settingsData]);

  // -- Derived state --
  const hasTracks = (stats?.totalTracks ?? 0) > 0;
  const hasLibraryPath = !!(settingsData?.library_path);
  const pendingEnrichment = (stats?.pending ?? 0)
    + ((stats?.artists ?? 0) - (stats?.enrichedArtists ?? 0))
    + ((stats?.albums ?? 0) - (stats?.enrichedAlbums ?? 0));

  // -- Enrich mutation --
  const enrichMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/metadata/enrich', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Enrichment failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  // -- Undo mutation --
  const undoMutation = useMutation({
    mutationFn: async (operationIds: string[]) => {
      const res = await fetch('/api/organizer/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationIds }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Undo failed');
      }
      return res.json() as Promise<UndoResult>;
    },
    onSuccess: (data) => {
      setUndoResult(data);
      setLastOperationIds([]);
      queryClient.invalidateQueries({ queryKey: ['organizer-history'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  // -- Organize All: sequential pipeline --
  async function handleOrganizeAll() {
    setOrganizeResults(null);
    setExecuteResult(null);
    setUndoResult(null);

    const results = {
      moved: 0,
      tagged: 0,
      covers: 0,
      nfos: 0,
      lyrics: 0,
      errors: [] as string[],
    };

    try {
      setOrganizeStep('preview');
      const previewRes = await fetch('/api/organizer/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!previewRes.ok) {
        const err = await previewRes.json();
        throw new Error(err.error || 'Preview failed');
      }
      const preview: PreviewResult = await previewRes.json();
      const readyItems = preview.items.filter(i => !i.skip);

      if (readyItems.length === 0) {
        setOrganizeStep('done');
        results.errors.push('No files ready to organize (all skipped or conflicting)');
        setOrganizeResults(results);
        return;
      }

      setOrganizeStep('move');
      const operations = readyItems.map(item => ({
        trackId: item.trackId,
        sourcePath: item.sourcePath,
        targetPath: item.targetPath,
        operation: 'move' as const,
      }));

      const execRes = await fetch('/api/organizer/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations }),
      });
      if (execRes.ok) {
        const execData: ExecuteResult = await execRes.json();
        results.moved = execData.completed;
        setLastOperationIds(execData.operationIds ?? []);
        setExecuteResult(execData);
        if (execData.errors?.length) {
          for (const e of execData.errors) {
            results.errors.push(`Move: ${e.error}`);
          }
        }
      } else {
        results.errors.push('File move failed');
      }

      setOrganizeStep('tags');
      try {
        const tagRes = await fetch('/api/organizer/tag-write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackIds: [] }),
        });
        if (tagRes.ok) {
          const tagData = await tagRes.json();
          results.tagged = tagData.summary?.succeeded ?? 0;
        } else {
          results.errors.push('Tag write failed');
        }
      } catch {
        results.errors.push('Tag write failed');
      }

      setOrganizeStep('covers');
      try {
        const coverRes = await fetch('/api/organizer/embed-covers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackIds: [], copyToFolders: true }),
        });
        if (coverRes.ok) {
          const coverData = await coverRes.json();
          results.covers = coverData.embed?.summary?.succeeded ?? 0;
        } else {
          results.errors.push('Cover embed failed');
        }
      } catch {
        results.errors.push('Cover embed failed');
      }

      setOrganizeStep('nfo');
      try {
        const nfoRes = await fetch('/api/organizer/generate-nfo', { method: 'POST' });
        if (nfoRes.ok) {
          const nfoData = await nfoRes.json();
          results.nfos = (nfoData.artistNfos ?? 0) + (nfoData.albumNfos ?? 0);
          results.lyrics = nfoData.lyricsFiles ?? 0;
        } else {
          results.errors.push('NFO generation failed');
        }
      } catch {
        results.errors.push('NFO generation failed');
      }

      setOrganizeStep('done');
      setOrganizeResults(results);
      queryClient.invalidateQueries({ queryKey: ['organizer-history'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Organization failed';
      results.errors.push(msg);
      setOrganizeStep('done');
      setOrganizeResults(results);
    }
  }

  const isOrganizing = organizeStep !== null && organizeStep !== 'done';
  const showOrganize = hasTracks || organizeResults || executeResult;
  const hasHistory = history && history.items && history.items.length > 0;

  if (!showOrganize && !hasHistory) return null;

  return (
    <div className="flex flex-col" style={{ gap: '2rem' }}>
      {/* Separator */}
      <div
        style={{
          height: '1px',
          background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent 100%)',
        }}
      />

      {/* Section Header */}
      <div>
        <h2 className="font-heading text-xl text-foreground">Organize</h2>
        <p className="text-xs text-foreground-tertiary mt-0.5">
          Enrich metadata, move files to your library, and write tags.
        </p>
      </div>

      {showOrganize && (
        <>
          {/* Warning: No library path */}
          {!hasLibraryPath && (
            <div
              className="relative rounded-xl border border-warning/20 overflow-hidden"
              style={{ padding: '1rem 1.25rem', background: 'rgba(234,179,8,0.03)' }}
            >
              <div
                className="absolute left-0 top-0 bottom-0"
                style={{
                  width: '3px',
                  background: 'linear-gradient(to bottom, rgba(234,179,8,0.5) 0%, rgba(234,179,8,0.1) 100%)',
                }}
              />
              <div className="flex items-start gap-3">
                <div
                  className="rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    width: '2rem',
                    height: '2rem',
                    background: 'rgba(234,179,8,0.06)',
                    border: '1px solid rgba(234,179,8,0.1)',
                  }}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-foreground">Library path not configured</h3>
                  <p className="text-xs text-foreground-tertiary mt-1">
                    Set a library path in Settings before organizing files.
                  </p>
                  <Link
                    href="/settings"
                    className="inline-flex items-center gap-1.5 mt-3 rounded-lg text-xs font-medium
                               bg-surface-tertiary text-foreground border border-border-subtle
                               hover:border-accent/30 hover:text-accent transition-all duration-200"
                    style={{ padding: '0.375rem 0.75rem' }}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Go to Settings
                  </Link>
                </div>
              </div>
            </div>
          )}

          <OrganizeToolbar
            duplicateStrategy={duplicateStrategy}
            onDuplicateStrategyChange={setDuplicateStrategy}
            onEnrich={() => enrichMutation.mutate()}
            onOrganizeAll={handleOrganizeAll}
            isEnriching={enrichMutation.isPending}
            isOrganizing={isOrganizing}
            pendingEnrichment={pendingEnrichment}
            trackCount={stats?.totalTracks ?? 0}
          />

          {organizeStep !== null && organizeStep !== 'done' && (
            <ExecuteProgress currentStep={organizeStep} />
          )}

          {enrichMutation.isError && (
            <div
              className="relative rounded-xl border border-error/20 overflow-hidden"
              style={{ padding: '1rem 1.25rem', background: 'rgba(239,68,68,0.03)' }}
            >
              <div
                className="absolute left-0 top-0 bottom-0"
                style={{ width: '3px', background: 'linear-gradient(to bottom, rgba(239,68,68,0.5) 0%, rgba(239,68,68,0.1) 100%)' }}
              />
              <p className="text-sm text-error">{enrichMutation.error?.message}</p>
            </div>
          )}

          {organizeStep === 'done' && organizeResults && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-xl border border-accent/20 overflow-hidden"
              style={{ background: 'linear-gradient(180deg, #111115 0%, #0E0E12 100%)', padding: '1.25rem' }}
            >
              <div
                className="absolute left-0 top-0 bottom-0"
                style={{ width: '3px', background: 'linear-gradient(to bottom, rgba(232,168,73,0.5) 0%, rgba(232,168,73,0.1) 100%)' }}
              />
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="rounded-lg flex items-center justify-center shrink-0"
                  style={{ width: '2rem', height: '2rem', background: 'rgba(232,168,73,0.06)', border: '1px solid rgba(232,168,73,0.08)' }}
                >
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-sm font-medium text-foreground">Organization Complete</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <SummaryItem label="Files moved" value={organizeResults.moved} />
                <SummaryItem label="Tags written" value={organizeResults.tagged} />
                <SummaryItem label="Covers embedded" value={organizeResults.covers} />
                <SummaryItem label="NFOs generated" value={organizeResults.nfos} />
                <SummaryItem label="Lyrics saved" value={organizeResults.lyrics} />
              </div>

              {organizeResults.errors.length > 0 && (
                <div className="mt-4 rounded-lg border border-error/10" style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.03)' }}>
                  <p className="text-xs font-medium text-error mb-1">
                    {organizeResults.errors.length} error{organizeResults.errors.length > 1 ? 's' : ''}:
                  </p>
                  {organizeResults.errors.slice(0, 5).map((err, i) => (
                    <p key={i} className="text-xs text-foreground-tertiary">{err}</p>
                  ))}
                  {organizeResults.errors.length > 5 && (
                    <p className="text-xs text-foreground-tertiary mt-1">...and {organizeResults.errors.length - 5} more</p>
                  )}
                </div>
              )}
            </motion.div>
          )}

          <ExecuteResults
            result={executeResult}
            undoResult={undoResult}
            operationIds={lastOperationIds}
            onUndo={(ids) => undoMutation.mutate(ids)}
            isUndoing={undoMutation.isPending}
          />
        </>
      )}

      <OperationsHistory
        history={history}
        page={historyPage}
        onPageChange={setHistoryPage}
        onUndo={(ids) => undoMutation.mutate(ids)}
        isUndoing={undoMutation.isPending}
        isLoading={historyLoading}
      />
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-lg text-center"
      style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}
    >
      <p className="text-lg font-mono font-semibold tabular-nums text-foreground">{value}</p>
      <p className="text-[11px] text-foreground-tertiary mt-0.5">{label}</p>
    </div>
  );
}
