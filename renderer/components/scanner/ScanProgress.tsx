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
      className="rounded-xl border border-accent/20 bg-surface-secondary p-6"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
          <div className="absolute inset-0 rounded-full bg-accent/10 animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">Scanning in progress...</h3>
          <p className="text-xs text-foreground-tertiary mt-0.5 font-mono truncate max-w-md">
            {folderPath}
          </p>
        </div>
      </div>

      {/* Animated progress bar */}
      <div className="h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-accent-dark to-accent"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
          style={{ boxShadow: '0 0 12px var(--color-accent)' }}
        />
      </div>

      <p className="mt-3 text-xs text-foreground-tertiary">
        Reading audio files and parsing metadata tags...
      </p>
    </motion.div>
  );
}
