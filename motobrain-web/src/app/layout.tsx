import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, IBM_Plex_Mono, Inter } from 'next/font/google';
import { AppProviders } from '@/components/providers/app-providers';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600'],
});

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'MotoBrain AI',
  description: 'Plataforma inteligente para talleres de motos en Colombia',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MotoBrain',
  },
  formatDetection: { telephone: false },
  themeColor: '#10b981',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${plusJakarta.variable} ${ibmPlexMono.variable} ${inter.variable} font-sans antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
