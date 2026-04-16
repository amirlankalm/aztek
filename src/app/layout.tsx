import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import TranslationProvider from '@/components/TranslationProvider';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin', 'cyrillic'], weight: ['400', '500', '700'] });

export const metadata: Metadata = {
  title: 'Aztek',
  description: 'Multi-Agent Information Dynamics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jetbrainsMono.className}>
      <body>
        <TranslationProvider>
          {children}
        </TranslationProvider>
      </body>
    </html>
  );
}
