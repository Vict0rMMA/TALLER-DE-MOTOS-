import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { AppProviders } from '@/components/providers/app-providers';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  preload: true,
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
  openGraph: {
    type: 'website',
    siteName: 'MotoBrain',
    title: 'MotoBrain — Gestión inteligente para talleres de motos',
    description: 'Administra servicios, clientes e inventario de tu taller de motos desde el celular.',
    images: [{ url: '/api/icons/1200', width: 1200, height: 630, alt: 'MotoBrain' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MotoBrain — Gestión inteligente para talleres de motos',
    description: 'Administra servicios, clientes e inventario de tu taller de motos desde el celular.',
    images: ['/api/icons/1200'],
  },
  icons: {
    icon: '/api/icons/32',
    apple: '/api/icons/180',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/api/icons/180" />
        <meta name="apple-mobile-web-app-title" content="MotoBrain" />
      </head>
      <body className={`${plusJakarta.variable} font-sans antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
