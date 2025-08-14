/** @type {import('next').NextConfig} */
const nextConfig = {
  // Удаляем эту строку
  images: {
    unoptimized: true,
    domains: [
      "source.unsplash.com",
      "images.unsplash.com",
      // Удаляем эти две строки
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      // Удаляем два следующих объекта
    ],
  },
};

module.exports = nextConfig;
