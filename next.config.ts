import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**", pathname: "/**" },
      { protocol: "http", hostname: "**", pathname: "/**" },
    ],
    localPatterns: [
      { pathname: "/logopreto.png" },
      { pathname: "/logobranco.png" },
      { pathname: "/imagem_dashboard.jpeg" },
      { pathname: "/homemfogo.jpeg" },
      { pathname: "/plify.png" },
    ],
  },
};

export default nextConfig;
