/** @type {import('next').NextConfig} */
const nextConfig = {
  // put only plain JS here, no TypeScript types like ": NextConfig"
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'static.wixstatic.com' },
      // add more hostnames if you load images elsewhere
    ],
  },
};

export default nextConfig;