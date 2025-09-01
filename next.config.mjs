/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
  },
};

export default nextConfig;

// images property

// In Next.js, if you use the <Image /> component, by default it only allows images from your own domain.
// If you want to load external images (like from randomuser.me), you need to whitelist those sources.

// remotePatterns

// This lets you define which external image domains and protocols are safe.
