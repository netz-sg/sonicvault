'use client';

import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareText, Loader2, X } from 'lucide-react';

interface LyricsPanelProps {
  trackId: string | null;
  trackTitle: string;
  onClose: () => void;
}

interface LyricsResponse {
  plain: string | null;
  synced: string | null;
  cached: boolean;
}

export function LyricsPanel({ trackId, trackTitle, onClose }: LyricsPanelProps) {
  const { data, isLoading } = useQuery<LyricsResponse>({
    queryKey: ['lyrics', trackId],
    queryFn: () => fetch(`/api/tracks/${trackId}/lyrics`).then((r) => r.json()),
    enabled: !!trackId,
  });

  const lyrics = data?.synced || data?.plain;

  return (
    <AnimatePresence>
      {trackId && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-border-subtle bg-surface-secondary overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle">
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquareText className="w-4 h-4 text-accent shrink-0" />
              <h3 className="text-sm font-medium text-foreground truncate">
                {trackTitle}
              </h3>
              {data?.cached && (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] bg-surface-tertiary text-foreground-tertiary">
                  cached
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-surface-tertiary text-foreground-tertiary hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center gap-2 py-8 justify-center text-foreground-tertiary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Fetching lyrics...</span>
              </div>
            ) : lyrics ? (
              <pre className="text-sm text-foreground-secondary leading-relaxed whitespace-pre-wrap font-sans">
                {formatLyrics(lyrics)}
              </pre>
            ) : (
              <div className="py-8 text-center">
                <MessageSquareText className="w-6 h-6 text-foreground-tertiary/30 mx-auto mb-2" />
                <p className="text-sm text-foreground-tertiary">
                  No lyrics available for this track.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Strip LRC timestamps from synced lyrics for plain display */
function formatLyrics(text: string): string {
  // Remove [mm:ss.xx] timestamps from synced lyrics
  return text.replace(/\[\d{2}:\d{2}\.\d{2,3}\]\s?/g, '').trim();
}
