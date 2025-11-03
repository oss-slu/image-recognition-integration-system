/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  // Only use static export in production
  ...(isProd ? { output: 'export', images: { unoptimized: true } } : {}),

  // For dev, keep image optimization and API routes active
  reactStrictMode: true,
};

export default nextConfig;