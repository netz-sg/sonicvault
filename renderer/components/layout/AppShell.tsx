'use client';

import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useLayoutStore } from '@/lib/store/useLayoutStore';

export function AppShell({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useLayoutStore((s) => s.sidebarCollapsed);

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
