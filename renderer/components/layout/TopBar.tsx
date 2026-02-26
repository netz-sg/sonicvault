'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ScanSearch } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';

const routeLabels: Record<string, string> = {
  '': 'Dashboard',
  artists: 'Artists',
  albums: 'Albums',
  scan: 'Scanner',
  organize: 'Organizer',
  settings: 'Settings',
};

export function TopBar() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/' },
    ...segments.map((seg, i) => ({
      label: routeLabels[seg] || seg,
      href: '/' + segments.slice(0, i + 1).join('/'),
    })),
  ];

  // Remove duplicate "Dashboard" when on home
  if (pathname === '/') {
    breadcrumbs.splice(1);
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 lg:px-8 bg-surface/80 backdrop-blur-xl">
      {/* Left border glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-border-subtle to-transparent" />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1;
          return (
            <span key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-foreground-tertiary" />
              )}
              {isLast ? (
                <span className="text-foreground font-medium">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-foreground-tertiary hover:text-foreground-secondary transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {/* Right side: Search + Actions */}
      <div className="flex items-center gap-4">
        <SearchInput
          placeholder="Search library..."
          className="w-64"
        />
        <Link
          href="/scan"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
        >
          <ScanSearch className="w-4 h-4" />
          <span className="hidden lg:inline">Scan</span>
        </Link>
      </div>
    </header>
  );
}
