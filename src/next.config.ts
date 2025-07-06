import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    allowedDevOrigins: [
      "https://*-firebase-studio-1751626552784.cluster-joak5ukfbnbyqspg4tewa33d24.cloudworkstations.dev",
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, 'handlebars'];
    }
    return config;
  },
};

export default nextConfig;
