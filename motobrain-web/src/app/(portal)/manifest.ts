import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MotoBrain — Mi Taller',
    short_name: 'Mi Taller',
    description: 'Seguimiento de tu moto y servicios en el taller',
    start_url: '/portal',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#10b981',
    orientation: 'portrait',
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
        name: 'Agendar revisión',
        url: '/portal',
        description: 'Solicitar cita en el taller',
      },
    ],
  };
}
