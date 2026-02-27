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
      className="rounded-xl border border-accent/20 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #111115 0%, #0E0E12 100%)',
        padding: '1.25rem',
      }}
    >
      {/* Steps */}
      <div className="flex flex-col gap-2 mb-4">
        {STEPS.map((step, i) => {
          const isDone = i < currentIndex;
          const isActive = i === currentIndex;

          return (
            <div key={step.id} className="flex items-center gap-3">
              <div className="flex items-center justify-center shrink-0" style={{ width: '1.25rem', height: '1.25rem' }}>
                {isDone ? (
                  <div
                    className="rounded flex items-center justify-center"
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      background: 'rgba(232,168,73,0.1)',
                      border: '1px solid rgba(232,168,73,0.15)',
                    }}
                  >
                    <Check className="w-3 h-3 text-accent" />
                  </div>
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
      <div className="h-1 rounded-full bg-surface-tertiary overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-linear-to-r from-accent-dark to-accent"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ boxShadow: '0 0 12px rgba(232,168,73,0.3)' }}
        />
      </div>

      <p className="text-xs text-foreground-tertiary mt-3 font-mono tabular-nums">
        Step {currentIndex + 1} of {STEPS.length}
      </p>
    </motion.div>
  );
}
