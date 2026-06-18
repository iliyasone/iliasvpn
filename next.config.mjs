/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // imapflow / mailparser are Node-only libraries; keep them external to the
  // server bundle so their native-ish deps resolve correctly on Vercel.
  serverExternalPackages: ["imapflow", "mailparser"],
};

export default nextConfig;
