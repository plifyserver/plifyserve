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
    proxyClientMaxBodySize: "200mb",
  },
  async redirects() {
    return [
      { source: "/portfolio", destination: "/albuns", permanent: true },
      { source: "/portfolio/:id", destination: "/albuns/:id", permanent: true },
      {
        source: "/palhaweddings/portfolio",
        destination: "/palhaweddings/albuns",
        permanent: true,
      },
      {
        source: "/palhaweddings/portfolio/:id",
        destination: "/palhaweddings/albuns/:id",
        permanent: true,
      },
    ];
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
      { pathname: "/palhaweddings/**" },
    ],
  },
};

export default nextConfig;
