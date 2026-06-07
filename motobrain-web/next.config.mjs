/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Rutas al proxy (por si NEXT_PUBLIC_API_URL apunta mal al dominio de Vercel). */
  async rewrites() {
    return [
      { source: '/backend/:path*', destination: '/api/backend/:path*' },
      { source: '/api/v1/:path*', destination: '/api/backend/:path*' },
    ];
  },
  eslint: {
    // Vercel: el build no debe fallar por deuda de lint en archivos legacy
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
};

export default nextConfig;
