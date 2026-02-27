'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Mic2,
  Disc3,
  Music,
  Clock,
  ScanSearch,
  ArrowRightLeft,
  Sparkles,
  FolderOpen,
  History,
  Copy,
  MoveRight,
  Tag,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { CursorGlow } from '@/components/ui/CursorGlow';
import { RecentAlbums } from '@/components/dashboard/RecentAlbums';
import { formatDurationLong } from '@/lib/utils/format';
import { useTranslation } from '@/lib/i18n/useTranslation';

// ── Types ──

interface LibraryStats {
  artists: number;
  albums: number;
  tracks: number;
  pending: number;
  enrichedArtists: number;
  enrichedAlbums: number;
  enrichedTracks: number;
  totalDurationMs: number;
  sourceFolders: number;
  totalOperations: number;
  recentOperations: Array<{
    id: string;
    operation: string;
    sourcePath: string;
    targetPath: string | null;
    status: string;
    createdAt: number;
  }>;
}

// ── Animations ──

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

// ── Dashboard Page ──

export default function DashboardPage() {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery<LibraryStats>({
    queryKey: ['stats'],
    queryFn: () => fetch('/api/library/stats').then((r) => r.json()),
    refetchInterval: 30000,
  });

  const { data: watchStatus } = useQuery<{
    enabled: boolean;
    processing: boolean;
    lastRun: number | null;
    nextRun: number | null;
    intervalMinutes: number;
  }>({
    queryKey: ['auto-watch-status'],
    queryFn: () => fetch('/api/auto-watch').then((r) => r.json()),
    refetchInterval: 10000,
  });

  const hasLibrary = (stats?.tracks ?? 0) > 0;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col"
      style={{ gap: '2rem' }}
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl text-foreground tracking-tight">
              {t('dashboard.title')}
            </h1>
            <p className="mt-1 text-foreground-secondary text-sm">
              {t('dashboard.subtitle')}
            </p>
          </div>

          {/* Auto-Watch Status */}
          {watchStatus?.enabled && (
            <Link
              href="/settings"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                         bg-surface-secondary border border-border-subtle
                         hover:border-accent/20 transition-all duration-200 group"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                watchStatus.processing ? 'bg-accent animate-pulse' : 'bg-success'
              }`} />
              <Eye className="w-3.5 h-3.5 text-foreground-tertiary group-hover:text-accent transition-colors" />
              <span className="text-xs text-foreground-tertiary group-hover:text-foreground-secondary transition-colors">
                {watchStatus.processing ? t('dashboard.processing') : t('dashboard.autoWatch')}
              </span>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: '1rem' }}>
        <StatCard icon={Mic2} label={t('dashboard.artists')} value={stats?.artists ?? 0} isLoading={isLoading} />
        <StatCard icon={Disc3} label={t('dashboard.albums')} value={stats?.albums ?? 0} isLoading={isLoading} />
        <StatCard icon={Music} label={t('dashboard.tracks')} value={stats?.tracks ?? 0} isLoading={isLoading} />
        <StatCard
          icon={Clock}
          label={t('dashboard.duration')}
          displayValue={formatDurationLong(stats?.totalDurationMs)}
          isLoading={isLoading}
        />
      </motion.div>

      {hasLibrary ? (
        <>
          {/* Recently Added Albums */}
          <motion.div variants={fadeUp}>
            <RecentAlbums />
          </motion.div>

          {/* Quick Actions — horizontal compact strip */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: '0.75rem' }}>
            <QuickAction
              href="/scan"
              icon={ScanSearch}
              title={t('dashboard.scanLibrary')}
              description={t('dashboard.scanDesc')}
            />
            <QuickAction
              href="/scan"
              icon={ArrowRightLeft}
              title={t('dashboard.organizeFiles')}
              description={t('dashboard.organizeDesc')}
              badge={stats?.pending ? `${stats.pending} ${t('dashboard.pending')}` : undefined}
            />
            <QuickAction
              href="/artists"
              icon={Sparkles}
              title={t('dashboard.browseArtists')}
              description={t('dashboard.browseDesc')}
            />
          </motion.div>

          {/* Library Health + Recent Activity */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '1rem' }}>
            <LibraryHealth stats={stats!} />
            <RecentActivity operations={stats?.recentOperations ?? []} />
          </motion.div>
        </>
      ) : (
        /* Empty Library */
        <motion.div variants={fadeUp}>
          <EmptyLibrary />
        </motion.div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// Dashboard Components
// ═══════════════════════════════════════════════════════

// ── Stat Card ──

function StatCard({
  icon: Icon,
  label,
  value,
  displayValue,
  isLoading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: number;
  displayValue?: string;
  isLoading: boolean;
}) {
  return (
    <CursorGlow className="rounded-xl">
      <div
        className="relative rounded-xl border border-border-subtle bg-surface-secondary
                    hover:border-accent/15 transition-all duration-300 overflow-hidden"
        style={{ padding: '1.25rem' }}
      >
        {/* Accent top line for active feel */}
        <div
          className="absolute top-0 left-4 right-4 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(232,168,73,0.12), transparent)' }}
        />

        <div className="flex items-center justify-between mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(232,168,73,0.06)', border: '1px solid rgba(232,168,73,0.08)' }}
          >
            <Icon className="w-4 h-4 text-accent" />
          </div>
          <span className="text-[11px] uppercase tracking-wider text-foreground-tertiary font-medium">
            {label}
          </span>
        </div>

        {isLoading ? (
          <div
            className="h-9 rounded bg-surface-tertiary animate-shimmer
                        bg-linear-to-r from-surface-tertiary via-surface-elevated to-surface-tertiary"
            style={{ width: '5rem' }}
          />
        ) : displayValue ? (
          <p className="text-2xl font-mono font-semibold text-foreground tabular-nums">
            {displayValue}
          </p>
        ) : (
          <AnimatedNumber
            value={value ?? 0}
            className="text-2xl font-semibold text-foreground"
          />
        )}
      </div>
    </CursorGlow>
  );
}

// ── Empty Library ──

function EmptyLibrary() {
  const { t } = useTranslation();

  return (
    <div
      className="relative rounded-xl border border-border-subtle overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(17,17,21,0.8) 0%, rgba(10,10,12,0.9) 100%)',
        padding: '3rem 2rem',
      }}
    >
      {/* Decorative gradient orb */}
      <div
        className="absolute opacity-30 rounded-full blur-3xl"
        style={{
          width: '20rem',
          height: '20rem',
          top: '-6rem',
          right: '-4rem',
          background: 'radial-gradient(circle, rgba(232,168,73,0.2) 0%, transparent 70%)',
        }}
      />

      <div className="relative text-center max-w-md mx-auto">
        <div
          className="mx-auto flex items-center justify-center rounded-2xl"
          style={{
            width: '4rem',
            height: '4rem',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, rgba(232,168,73,0.12) 0%, rgba(232,168,73,0.04) 100%)',
            border: '1px solid rgba(232,168,73,0.1)',
          }}
        >
          <Music className="w-7 h-7 text-accent/60" />
        </div>

        <h3 className="font-heading text-xl text-foreground" style={{ marginBottom: '0.5rem' }}>
          {t('dashboard.emptyTitle')}
        </h3>
        <p className="text-sm text-foreground-secondary leading-relaxed" style={{ marginBottom: '1.5rem' }}>
          {t('dashboard.emptyDesc')}
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/scan"
            className="inline-flex items-center gap-2 rounded-lg bg-accent text-surface
                       text-sm font-semibold hover:bg-accent-dark transition-colors"
            style={{
              padding: '0.625rem 1.25rem',
              boxShadow: '0 0 16px var(--accent-glow)',
            }}
          >
            <ScanSearch className="w-4 h-4" />
            {t('dashboard.startScanning')}
          </Link>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium
                       text-foreground-secondary border border-border-subtle
                       hover:border-accent/20 hover:text-foreground transition-all"
            style={{ padding: '0.625rem 1.25rem' }}
          >
            {t('dashboard.settings')}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Library Health ──

function LibraryHealth({ stats }: { stats: LibraryStats }) {
  const { t } = useTranslation();

  const enrichmentItems = [
    { label: t('dashboard.artists'), enriched: stats.enrichedArtists, total: stats.artists, icon: Mic2 },
    { label: t('dashboard.albums'), enriched: stats.enrichedAlbums, total: stats.albums, icon: Disc3 },
    { label: t('dashboard.tracks'), enriched: stats.enrichedTracks, total: stats.tracks, icon: Music },
  ];

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-secondary" style={{ padding: '1.25rem' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-medium text-foreground">{t('dashboard.libraryHealth')}</h3>
        </div>
        {stats.pending > 0 && (
          <Link
            href="/scan"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium
                       bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          >
            {stats.pending} {t('dashboard.pending')}
          </Link>
        )}
      </div>

      <div className="flex flex-col" style={{ gap: '1rem' }}>
        {enrichmentItems.map((item, idx) => {
          const pct = item.total > 0 ? Math.round((item.enriched / item.total) * 100) : 0;
          return (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <item.icon className="w-3.5 h-3.5 text-foreground-tertiary" />
                  <span className="text-xs text-foreground-secondary">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-foreground-tertiary tabular-nums">
                    {item.enriched}/{item.total}
                  </span>
                  <span
                    className="text-[10px] font-mono tabular-nums font-medium"
                    style={{ color: pct === 100 ? 'var(--color-success)' : pct > 0 ? 'var(--color-accent)' : 'var(--color-foreground-tertiary)' }}
                  >
                    {pct}%
                  </span>
                </div>
              </div>
              <div
                className="rounded-full bg-surface-tertiary overflow-hidden"
                style={{ height: '4px' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
                  style={{
                    background: pct === 100
                      ? 'var(--color-success)'
                      : 'linear-gradient(90deg, var(--color-accent-dark), var(--color-accent))',
                    boxShadow: pct > 0 ? '0 0 6px rgba(232,168,73,0.3)' : undefined,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Recent Activity ──

const opIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  copy: Copy,
  move: MoveRight,
  tag_write: Tag,
};

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  completed: CheckCircle2,
  failed: XCircle,
  undone: RotateCcw,
};

const statusColors: Record<string, string> = {
  completed: 'text-success',
  failed: 'text-error',
  undone: 'text-warning',
};

function RecentActivity({
  operations,
}: {
  operations: Array<{
    id: string;
    operation: string;
    sourcePath: string;
    targetPath: string | null;
    status: string;
    createdAt: number;
  }>;
}) {
  const { t } = useTranslation();

  const opLabels: Record<string, string> = {
    copy: t('op.copied'),
    move: t('op.moved'),
    tag_write: t('op.tagsWritten'),
    rename: t('op.renamed'),
    delete: t('op.deleted'),
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-secondary" style={{ padding: '1.25rem' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-foreground-tertiary" />
          <h3 className="text-sm font-medium text-foreground">{t('dashboard.recentActivity')}</h3>
        </div>
        {operations.length > 0 && (
          <Link
            href="/scan"
            className="text-[11px] text-foreground-tertiary hover:text-accent transition-colors"
          >
            {t('dashboard.viewAll')}
          </Link>
        )}
      </div>

      {operations.length === 0 ? (
        <div style={{ padding: '1.5rem 0' }} className="text-center">
          <History className="w-4.5 h-4.5 text-foreground-tertiary mx-auto mb-2 opacity-40" />
          <p className="text-xs text-foreground-tertiary">
            {t('dashboard.noActivity')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: '0.125rem' }}>
          {operations.slice(0, 6).map((op) => {
            const OpIcon = opIcons[op.operation] ?? MoveRight;
            const StatusIcon = statusIcons[op.status] ?? CheckCircle2;
            const fileName = op.sourcePath.replace(/\\/g, '/').split('/').pop() ?? op.sourcePath;
            const timeAgo = getTimeAgo(op.createdAt, t);

            return (
              <div
                key={op.id}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-tertiary/30 transition-colors"
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <OpIcon className="w-3.5 h-3.5 text-foreground-tertiary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground truncate">{fileName}</p>
                  <p className="text-[11px] text-foreground-tertiary">
                    {opLabels[op.operation] ?? op.operation}
                  </p>
                </div>
                <StatusIcon className={`w-3 h-3 shrink-0 ${statusColors[op.status] ?? 'text-foreground-tertiary'}`} />
                <span className="text-[11px] text-foreground-tertiary shrink-0 tabular-nums font-mono">
                  {timeAgo}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Time ago helper ──

function getTimeAgo(timestamp: number, t: (key: string, params?: Record<string, string | number>) => string): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return t('time.justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('time.mAgo', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('time.hAgo', { n: hours });
  const days = Math.floor(hours / 24);
  return t('time.dAgo', { n: days });
}

// ── Quick Action ──

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
  badge,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border-subtle
                 bg-surface-secondary/50 hover:border-accent/15 hover:bg-surface-secondary
                 transition-all duration-300"
      style={{ padding: '1rem' }}
    >
      <div
        className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center
                    group-hover:bg-accent/10 transition-colors"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <Icon className="w-4 h-4 text-foreground-secondary group-hover:text-accent transition-colors" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
            {title}
          </h3>
          {badge && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent/10 text-accent">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-foreground-tertiary leading-relaxed mt-0.5">
          {description}
        </p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-foreground-tertiary/40 group-hover:text-accent/40 shrink-0 transition-colors" />
    </Link>
  );
}
