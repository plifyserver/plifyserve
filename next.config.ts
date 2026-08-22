import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/** Evita o Next inferir a raiz errada quando existe outro package-lock na pasta pai. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV !== "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://js.stripe.com https://*.vercel.live",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  isDev
    ? "connect-src 'self' http: https: ws: wss: blob:"
    : "connect-src 'self' https: wss: blob:",
  "media-src 'self' blob: https:",
  "worker-src 'self' blob: https://unpkg.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://accounts.google.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com https://accounts.google.com",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(self), geolocation=(self), microphone=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

if (!isDev) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  });
}

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    proxyClientMaxBodySize: "200mb",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
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
