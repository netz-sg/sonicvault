'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScanSearch, Loader2, FolderOpen, Settings } from 'lucide-react';
import Link from 'next/link';
import { ScanProgress } from '@/components/scanner/ScanProgress';
import { ScanResults } from '@/components/scanner/ScanResults';
import { OrganizeSection } from '@/components/organizer/OrganizeSection';
import type { ScanResult } from '@/components/scanner/types';

export default function ScanPage() {
  const queryClient = useQueryClient();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // -- Fetch library path from settings --
  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then((r) => r.json()),
  });

  const libraryPath = settings?.library_path ?? '';

  // -- Scan mutation --
  const scanMutation = useMutation({
    mutationFn: async (dirPath: string) => {
      const res = await fetch('/api/library/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: dirPath }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Scan failed');
      }
      return res.json() as Promise<ScanResult>;
    },
    onSuccess: (data) => {
      setScanResult(data);
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  function handleScan() {
    if (!libraryPath) return;
    setScanResult(null);
    scanMutation.mutate(libraryPath);
  }

  const isScanning = scanMutation.isPending;

  return (
    <div className="flex flex-col" style={{ gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl text-foreground tracking-tight">
          Library Scanner
        </h1>
        <p className="mt-1 text-foreground-secondary text-sm">
          Scan your library for music files and organize them.
        </p>
      </div>

      {/* Library Scan */}
      {libraryPath ? (
        <div
          className="rounded-xl border border-border-subtle overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #111115 0%, #0E0E12 100%)',
            padding: '1.25rem',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="rounded-lg flex items-center justify-center shrink-0"
                style={{
                  width: '2.25rem',
                  height: '2.25rem',
                  background: 'rgba(232,168,73,0.06)',
                  border: '1px solid rgba(232,168,73,0.08)',
                }}
              >
                <FolderOpen className="w-4 h-4 text-accent/60" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Library</p>
                <p className="text-xs font-mono text-foreground-tertiary truncate mt-0.5">
                  {libraryPath}
                </p>
              </div>
            </div>
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="flex items-center gap-2 rounded-lg text-sm font-medium
                         bg-accent text-surface border border-accent hover:bg-accent-dark
                         transition-all duration-200 disabled:opacity-50"
              style={{
                padding: '0.5rem 1rem',
                boxShadow: '0 0 12px rgba(232,168,73,0.15)',
              }}
            >
              {isScanning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ScanSearch className="w-4 h-4" />
              )}
              {isScanning ? 'Scanning...' : 'Scan'}
            </button>
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl border border-dashed border-border-subtle text-center"
          style={{ padding: '2.5rem 1.5rem' }}
        >
          <div
            className="mx-auto rounded-full flex items-center justify-center"
            style={{
              width: '3.5rem',
              height: '3.5rem',
              background: 'rgba(232,168,73,0.06)',
              border: '1px solid rgba(232,168,73,0.08)',
              marginBottom: '1rem',
            }}
          >
            <FolderOpen className="w-6 h-6 text-accent/25" />
          </div>
          <p className="text-sm text-foreground-secondary">No library path configured</p>
          <p className="text-xs text-foreground-tertiary mt-1" style={{ marginBottom: '1rem' }}>
            Set your library path in Settings to start scanning.
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 rounded-lg text-xs font-medium
                       text-foreground-secondary border border-border-subtle
                       hover:border-accent/30 hover:text-accent transition-all duration-200"
            style={{ padding: '0.5rem 1rem' }}
          >
            <Settings className="w-3.5 h-3.5" />
            Go to Settings
          </Link>
        </div>
      )}

      {/* Scan Progress */}
      {isScanning && <ScanProgress folderPath={libraryPath} />}

      {/* Scan Results */}
      {scanResult && <ScanResults result={scanResult} />}

      {/* Error display */}
      {scanMutation.isError && (
        <div
          className="relative rounded-xl border border-error/20 overflow-hidden"
          style={{ padding: '1rem 1.25rem', background: 'rgba(239,68,68,0.03)' }}
        >
          <div
            className="absolute left-0 top-0 bottom-0"
            style={{
              width: '3px',
              background: 'linear-gradient(to bottom, rgba(239,68,68,0.5) 0%, rgba(239,68,68,0.1) 100%)',
            }}
          />
          <p className="text-sm text-error">{scanMutation.error?.message}</p>
        </div>
      )}

      {/* Organize */}
      <OrganizeSection />
    </div>
  );
}
