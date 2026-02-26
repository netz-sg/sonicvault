'use client';

import { useState } from 'react';
import { FolderOpen, Plus, Loader2 } from 'lucide-react';

interface FolderPickerProps {
  onScan: (path: string) => void;
  isScanning: boolean;
}

export function FolderPicker({ onScan, isScanning }: FolderPickerProps) {
  const [folderPath, setFolderPath] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = folderPath.trim();
    if (!trimmed) return;
    onScan(trimmed);
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-secondary p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <FolderOpen className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">Quick Scan</h3>
          <p className="text-xs text-foreground-tertiary">
            Enter a folder path to scan for music files
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={folderPath}
          onChange={(e) => setFolderPath(e.target.value)}
          placeholder="/path/to/music/folder"
          disabled={isScanning}
          className="flex-1 px-4 py-2.5 bg-surface-tertiary/50 border border-border-subtle rounded-lg text-sm text-foreground placeholder:text-foreground-tertiary/50 focus:outline-none focus:border-accent/30 focus:ring-1 focus:ring-accent/10 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isScanning || !folderPath.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-surface text-sm font-semibold hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isScanning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {isScanning ? 'Scanning...' : 'Scan'}
        </button>
      </form>
    </div>
  );
}
