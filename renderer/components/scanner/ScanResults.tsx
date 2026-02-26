'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Mic2, Disc3, Music, SkipForward } from 'lucide-react';
import type { ScanResult } from './types';

interface ScanResultsProps {
  result: ScanResult;
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
};

export function ScanResults({ result }: ScanResultsProps) {
  const hasErrors = result.errors.length > 0;
  const isSuccess = result.newTracks > 0 || result.newAlbums > 0 || result.newArtists > 0;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {/* Summary Banner */}
      <motion.div
        variants={fadeUp}
        className={`rounded-xl border p-5 ${
          isSuccess
            ? 'border-success/20 bg-success/5'
            : 'border-border-subtle bg-surface-secondary'
        }`}
      >
        <div className="flex items-center gap-3">
          <CheckCircle2
            className={`w-5 h-5 ${isSuccess ? 'text-success' : 'text-foreground-tertiary'}`}
          />
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Scan complete
            </h3>
            <p className="text-xs text-foreground-secondary mt-0.5">
              {result.audioFiles} audio file{result.audioFiles !== 1 ? 's' : ''} found
              {result.skipped > 0 && `, ${result.skipped} already in library`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ResultCard
          icon={Mic2}
          label="New Artists"
          value={result.newArtists}
          accent={result.newArtists > 0}
        />
        <ResultCard
          icon={Disc3}
          label="New Albums"
          value={result.newAlbums}
          accent={result.newAlbums > 0}
        />
        <ResultCard
          icon={Music}
          label="New Tracks"
          value={result.newTracks}
          accent={result.newTracks > 0}
        />
        <ResultCard
          icon={SkipForward}
          label="Skipped"
          value={result.skipped}
          accent={false}
        />
      </motion.div>

      {/* Errors */}
      {hasErrors && (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-error/20 bg-error/5 p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-error" />
            <h4 className="text-sm font-medium text-error">
              {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}
            </h4>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {result.errors.map((err, i) => (
              <div key={i} className="text-xs text-foreground-secondary">
                <span className="font-mono text-foreground-tertiary truncate block">
                  {err.file}
                </span>
                <span className="text-error/80">{err.error}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function ResultCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: boolean;
}) {
  return (
    <div className="rounded-xl bg-surface-secondary border border-border-subtle p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${accent ? 'text-accent' : 'text-foreground-tertiary'}`} />
        <span className="text-xs text-foreground-tertiary">{label}</span>
      </div>
      <p className={`text-2xl font-mono font-semibold tabular-nums ${accent ? 'text-accent' : 'text-foreground'}`}>
        {value}
      </p>
    </div>
  );
}
