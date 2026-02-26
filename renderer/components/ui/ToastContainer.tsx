'use client';

import { useToastStore } from '@/lib/store/useToastStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: 'border-success/30 bg-success/10',
  error: 'border-error/30 bg-error/10',
  info: 'border-accent/30 bg-accent/10',
  warning: 'border-warning/30 bg-warning/10',
};

const iconColors = {
  success: 'text-success',
  error: 'text-error',
  info: 'text-accent',
  warning: 'text-warning',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" style={{ maxWidth: '380px' }}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className={`relative rounded-xl border backdrop-blur-xl p-3.5 shadow-lg ${colors[toast.type]}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColors[toast.type]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{toast.title}</p>
                  {toast.description && (
                    <p className="text-xs text-foreground-secondary mt-0.5 leading-relaxed">
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 p-1 rounded-md text-foreground-tertiary hover:text-foreground hover:bg-surface-tertiary/50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
