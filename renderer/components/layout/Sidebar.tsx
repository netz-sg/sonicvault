'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Mic2,
  Disc3,
  ScanSearch,
  ArrowRightLeft,
  Settings,
  ChevronLeft,
  ChevronRight,
  Music,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLayoutStore } from '@/lib/store/useLayoutStore';

interface LibraryStats {
  artists: number;
  albums: number;
  tracks: number;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/artists', label: 'Artists', icon: Mic2 },
  { href: '/albums', label: 'Albums', icon: Disc3 },
  { href: '/scan', label: 'Scanner', icon: ScanSearch },
  { href: '/organize', label: 'Organizer', icon: ArrowRightLeft },
];

const bottomItems = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);
  const pathname = usePathname();

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
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-surface-secondary overflow-hidden"
    >
      {/* Subtle right border gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-linear-to-b from-transparent via-border-subtle to-transparent" />

      {/* ── Logo ── */}
      <div className="flex items-center h-16 px-4 gap-3 flex-shrink-0">
        <div className="relative flex-shrink-0 w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
          <Music className="w-[18px] h-[18px] text-accent" />
          <div className="absolute inset-0 rounded-xl bg-accent/10 animate-pulse" />
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="font-heading text-xl text-foreground tracking-tight whitespace-nowrap"
            >
              SonicVault
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Main Navigation ── */}
      <nav className="flex-1 px-3 pt-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* ── Library Stats ── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-5 py-4 border-t border-border-subtle"
          >
            <p className="text-[10px] uppercase tracking-widest text-foreground-tertiary mb-3 font-medium">
              Library
            </p>
            <div className="space-y-2">
              <StatRow label="Artists" value={stats?.artists ?? 0} />
              <StatRow label="Albums" value={stats?.albums ?? 0} />
              <StatRow label="Tracks" value={stats?.tracks ?? 0} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom: Settings + Collapse ── */}
      <div className="px-3 pb-2 pt-1 border-t border-border-subtle flex-shrink-0">
        {bottomItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full mt-1 py-2.5 rounded-lg text-foreground-tertiary hover:text-foreground-secondary transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
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
        group relative flex items-center gap-3 rounded-lg transition-all duration-200
        ${collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'}
        ${
          active
            ? 'text-accent'
            : 'text-foreground-secondary hover:text-foreground'
        }
      `}
    >
      {/* Active indicator background */}
      {active && (
        <motion.div
          layoutId="sidebar-active-bg"
          className="absolute inset-0 rounded-lg bg-accent/10"
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
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent"
          style={{ boxShadow: '0 0 8px var(--color-accent)' }}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
        />
      )}

      <Icon className="relative z-10 w-[18px] h-[18px] flex-shrink-0" />

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
