/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["playwright-core"]
  },
  async headers() {
    return [
      {
        source: "/demo/api",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }]
      }
    ];
  }
};

export default nextConfig;
