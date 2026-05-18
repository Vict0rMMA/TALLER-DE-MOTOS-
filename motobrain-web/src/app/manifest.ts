import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MotoBrain AI',
    short_name: 'MotoBrain',
    description: 'Plataforma inteligente para talleres de motos',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0b',
    theme_color: '#10b981',
    orientation: 'portrait',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Servicios',
        url: '/servicios',
        description: 'Ver servicios activos',
      },
      {
        name: 'Consultas',
        url: '/consultas',
        description: 'Bandeja de consultas',
      },
    ],
  };
}
