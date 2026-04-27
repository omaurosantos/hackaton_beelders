/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    ).replace(/\/+$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
