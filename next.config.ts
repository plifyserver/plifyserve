import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/** Evita o Next inferir a raiz errada quando existe outro package-lock na pasta pai. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
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
