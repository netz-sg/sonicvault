'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useLayoutStore } from '@/lib/store/useLayoutStore';
import { useLocaleStore } from '@/lib/store/useLocaleStore';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import type { Locale } from '@/lib/i18n/translations';

export function AppShell({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const { data: settings, isLoading: settingsLoading } = useQuery<Record<string, string>>({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then((r) => r.json()),
  });

  // Sync locale from settings into Zustand store
  useEffect(() => {
    const lang = settings?.ui_language;
    if (lang === 'de' || lang === 'en') {
      setLocale(lang as Locale);
    }
  }, [settings?.ui_language, setLocale]);

  const onboardingCompleted = settings?.onboarding_completed === 'true';

  if (settingsLoading) {
    return <div className="min-h-screen bg-surface" />;
  }

  if (!onboardingCompleted) {
    return <OnboardingWizard />;
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />

      <motion.div
        className="flex-1 flex flex-col min-h-screen"
        animate={{ marginLeft: sidebarCollapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <TopBar />

        <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </motion.div>
    </div>
  );
}
