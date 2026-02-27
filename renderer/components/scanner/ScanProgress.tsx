'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ScanProgressProps {
  folderPath: string;
}

export function ScanProgress({ folderPath }: ScanProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-accent/20 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #111115 0%, #0E0E12 100%)',
        padding: '1.25rem',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="rounded-lg flex items-center justify-center shrink-0"
          style={{
            width: '2.25rem',
            height: '2.25rem',
            background: 'rgba(232,168,73,0.06)',
            border: '1px solid rgba(232,168,73,0.08)',
          }}
        >
          <Loader2 className="w-4 h-4 text-accent animate-spin" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">Scanning in progress...</h3>
          <p className="text-xs text-foreground-tertiary mt-0.5 font-mono truncate max-w-md">
            {folderPath}
          </p>
        </div>
      </div>

      {/* Animated progress bar */}
      <div className="h-1 rounded-full bg-surface-tertiary overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-accent-dark to-accent"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
          style={{ boxShadow: '0 0 12px rgba(232,168,73,0.3)' }}
        />
      </div>

      <p className="mt-3 text-xs text-foreground-tertiary">
        Reading audio files and parsing metadata tags...
      </p>
    </motion.div>
  );
}
