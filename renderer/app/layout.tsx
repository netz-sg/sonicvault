import type { Metadata } from 'next';
import { DM_Serif_Display, DM_Sans, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import { AppShell } from '@/components/layout/AppShell';
import { ToastContainer } from '@/components/ui/ToastContainer';
import '@/styles/globals.css';

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dm-serif',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SonicVault',
  description: 'Self-Hosted Music Library Manager',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSerifDisplay.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-surface font-sans text-foreground antialiased">
        <Providers>
          <AppShell>
            {children}
          </AppShell>
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
