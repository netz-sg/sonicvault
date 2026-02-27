'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Mic2,
  Disc3,
  ScanSearch,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Music,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLayoutStore } from '@/lib/store/useLayoutStore';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface LibraryStats {
  artists: number;
  albums: number;
  tracks: number;
}

const navItemDefs = [
  { href: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/artists', labelKey: 'nav.artists', icon: Mic2 },
  { href: '/albums', labelKey: 'nav.albums', icon: Disc3 },
  { href: '/scan', labelKey: 'nav.scanner', icon: ScanSearch },
];

const bottomItemDefs = [
  { href: '/settings', labelKey: 'nav.settings', icon: Settings },
];

export function Sidebar() {
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);
  const pathname = usePathname();
  const { t } = useTranslation();

  const { data: stats } = useQuery<LibraryStats>({
    queryKey: ['sidebar-stats'],
    queryFn: () => fetch('/api/library/stats').then((r) => r.json()),
    refetchInterval: 30000,
  });

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #111115 0%, #0D0D10 100%)' }}
    >
      {/* Right edge line */}
      <div
        className="absolute right-0 top-0 bottom-0 w-px"
        style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent 100%)' }}
      />

      {/* Logo */}
      <div
        className="flex items-center shrink-0"
        style={{ height: '4rem', paddingLeft: collapsed ? '0' : '1.25rem', paddingRight: '1rem', justifyContent: collapsed ? 'center' : 'flex-start', gap: '0.75rem' }}
      >
        <div
          className="relative shrink-0 flex items-center justify-center rounded-xl"
          style={{
            width: '2.25rem',
            height: '2.25rem',
            background: 'linear-gradient(135deg, rgba(232,168,73,0.18) 0%, rgba(232,168,73,0.06) 100%)',
            border: '1px solid rgba(232,168,73,0.15)',
          }}
        >
          <Music className="w-4 h-4 text-accent" />
          {/* Subtle warm inner glow instead of cheap pulse */}
          <div
            className="absolute inset-0 rounded-xl"
            style={{ boxShadow: 'inset 0 1px 0 rgba(232,168,73,0.1), 0 0 12px rgba(232,168,73,0.06)' }}
          />
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.2 }}
              className="flex items-baseline whitespace-nowrap"
              style={{ gap: '0.35rem' }}
            >
              <span className="font-heading text-foreground" style={{ fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
                Sonic
              </span>
              <span className="font-heading text-accent" style={{ fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
                Vault
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav section label */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ paddingLeft: '1.25rem', paddingRight: '1rem', marginBottom: '0.5rem' }}
          >
            <span className="text-[10px] uppercase tracking-widest text-foreground-tertiary font-medium">
              {t('nav.navigate')}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Navigation */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ paddingLeft: '0.625rem', paddingRight: '0.625rem' }}
      >
        <div className="flex flex-col" style={{ gap: '0.125rem' }}>
          {navItemDefs.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={t(item.labelKey)}
              icon={item.icon}
              active={isActive(item.href)}
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      {/* Library Stats */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            style={{ margin: '0 0.75rem', padding: '0.875rem', marginBottom: '0.5rem' }}
            className="rounded-lg"
          >
            <p
              className="text-[10px] uppercase tracking-widest text-foreground-tertiary font-medium"
              style={{ marginBottom: '0.625rem' }}
            >
              {t('nav.library')}
            </p>
            <div className="flex flex-col" style={{ gap: '0.375rem' }}>
              <StatRow label={t('nav.artists')} value={stats?.artists ?? 0} />
              <StatRow label={t('nav.albums')} value={stats?.albums ?? 0} />
              <StatRow label={t('dashboard.tracks')} value={stats?.tracks ?? 0} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed stats: single track count */}
      <AnimatePresence>
        {collapsed && stats && (stats.tracks > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center"
            style={{ marginBottom: '0.5rem' }}
          >
            <span className="text-[10px] font-mono text-foreground-tertiary tabular-nums">
              {stats.tracks.toLocaleString()}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom: Settings + Collapse */}
      <div
        className="shrink-0 flex flex-col"
        style={{
          paddingLeft: '0.625rem',
          paddingRight: '0.625rem',
          paddingBottom: '0.625rem',
          paddingTop: '0.5rem',
          gap: '0.125rem',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {bottomItemDefs.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={t(item.labelKey)}
            icon={item.icon}
            active={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}
        <button
          onClick={toggleSidebar}
          className={`
            group relative flex items-center rounded-lg transition-all duration-200
            text-foreground-tertiary hover:text-foreground-secondary
            ${collapsed ? 'justify-center' : ''}
          `}
          style={{
            padding: collapsed ? '0.625rem 0' : '0.625rem 0.75rem',
            gap: '0.75rem',
            marginTop: '0.125rem',
          }}
        >
          <div className="absolute inset-0 rounded-lg bg-surface-tertiary opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          {collapsed ? (
            <PanelLeftOpen className="relative z-10 w-4.5 h-4.5 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="relative z-10 w-4.5 h-4.5 shrink-0" />
              <span className="relative z-10 text-sm font-medium whitespace-nowrap">{t('nav.collapse')}</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}

/* ── Navigation Item ── */
function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        group relative flex items-center rounded-lg transition-all duration-200
        ${collapsed ? 'justify-center' : ''}
        ${active ? 'text-accent' : 'text-foreground-secondary hover:text-foreground'}
      `}
      style={{
        padding: collapsed ? '0.625rem 0' : '0.625rem 0.75rem',
        gap: '0.75rem',
      }}
    >
      {/* Active background */}
      {active && (
        <motion.div
          layoutId="sidebar-active-bg"
          className="absolute inset-0 rounded-lg"
          style={{ background: 'rgba(232,168,73,0.08)' }}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
        />
      )}

      {/* Hover background */}
      {!active && (
        <div className="absolute inset-0 rounded-lg bg-surface-tertiary opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      )}

      {/* Active glow bar */}
      {active && (
        <motion.div
          layoutId="sidebar-active-bar"
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full bg-accent"
          style={{
            width: '3px',
            height: '1.125rem',
            boxShadow: '0 0 8px rgba(232,168,73,0.4)',
          }}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
        />
      )}

      <Icon className="relative z-10 w-4.5 h-4.5 shrink-0" />

      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 text-sm font-medium whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}

/* ── Stat Row ── */
function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-foreground-tertiary">{label}</span>
      <span className="text-xs font-mono text-foreground-secondary tabular-nums">
        {value.toLocaleString()}
      </span>
    </div>
  );
}
