// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // إعدادات الصور المطلوبة لمكون next/image
  images: {
    domains: ['alrasekhooninlaw.com'],
    // أو استخدام remotePatterns للإصدارات الحديثة من Next.js
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'alrasekhooninlaw.com',
        port: '',
        pathname: '/bousla/img/ser_chi/**',
      },
    ],
  },

  // إعدادات rewrites
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://alraskun.atwebpages.com/:path*',
      },
    ];
  },
};



// تصدير واحد فقط
export default nextConfig;