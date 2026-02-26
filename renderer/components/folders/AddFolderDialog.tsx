'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, FolderPlus, Loader2 } from 'lucide-react';

interface AddFolderDialogProps {
  onAdd: (path: string, label: string) => void;
  isAdding: boolean;
}

export function AddFolderDialog({ onAdd, isAdding }: AddFolderDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [folderPath, setFolderPath] = useState('');
  const [label, setLabel] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedPath = folderPath.trim();
    if (!trimmedPath) return;
    onAdd(trimmedPath, label.trim());
    setFolderPath('');
    setLabel('');
    setIsOpen(false);
  }

  return (
    <div>
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="trigger"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border-subtle text-sm text-foreground-secondary hover:border-accent/30 hover:text-accent transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Source Folder
          </motion.button>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="rounded-xl border border-accent/20 bg-surface-secondary p-5 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-medium text-foreground">Add Source Folder</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-foreground-tertiary hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-foreground-secondary mb-1 block">
                  Folder Path
                </label>
                <input
                  type="text"
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  placeholder="/path/to/music/downloads"
                  autoFocus
                  className="w-full px-3 py-2 bg-surface-tertiary/50 border border-border-subtle rounded-lg text-sm text-foreground placeholder:text-foreground-tertiary/50 focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-foreground-secondary mb-1 block">
                  Label (optional)
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Downloads, NAS Music"
                  className="w-full px-3 py-2 bg-surface-tertiary/50 border border-border-subtle rounded-lg text-sm text-foreground placeholder:text-foreground-tertiary/50 focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAdding || !folderPath.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-surface text-sm font-semibold hover:bg-accent-dark transition-colors disabled:opacity-40"
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add Folder
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
