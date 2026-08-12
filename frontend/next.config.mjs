/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Suppress the static export page rename issue on Windows
  output: 'standalone',
};

export default nextConfig;
