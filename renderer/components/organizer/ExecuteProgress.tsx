'use client';

import { motion } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';

export type OrganizeStepId = 'preview' | 'move' | 'tags' | 'covers' | 'nfo';

const STEPS: Array<{ id: OrganizeStepId; label: string }> = [
  { id: 'preview', label: 'Preparing...' },
  { id: 'move', label: 'Moving files' },
  { id: 'tags', label: 'Writing tags' },
  { id: 'covers', label: 'Embedding covers' },
  { id: 'nfo', label: 'Generating NFOs & lyrics' },
];

interface ExecuteProgressProps {
  currentStep: OrganizeStepId;
}

export function ExecuteProgress({ currentStep }: ExecuteProgressProps) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);
  const progress = ((currentIndex + 0.5) / STEPS.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-accent/20 bg-surface-secondary p-5"
    >
      {/* Steps */}
      <div className="space-y-2 mb-4">
        {STEPS.map((step, i) => {
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;

          return (
            <div key={step.id} className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                {isDone ? (
                  <Check className="w-4 h-4 text-accent" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 text-accent animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-surface-tertiary" />
                )}
              </div>
              <span className={`text-sm ${
                isActive ? 'text-foreground font-medium' :
                isDone ? 'text-foreground-tertiary' :
                'text-foreground-tertiary/50'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-accent-dark to-accent"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ boxShadow: '0 0 12px var(--color-accent)' }}
        />
      </div>

      <p className="text-xs text-foreground-tertiary mt-3">
        Step {currentIndex + 1} of {STEPS.length}
      </p>
    </motion.div>
  );
}
