/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Compatibilidad: /backend → proxy serverless /api/backend (no sale directo al VPS desde el edge). */
  async rewrites() {
    return [{ source: '/backend/:path*', destination: '/api/backend/:path*' }];
  },
  eslint: {
    // Vercel: el build no debe fallar por deuda de lint en archivos legacy
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
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
