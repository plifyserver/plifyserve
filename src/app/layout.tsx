import type { Metadata, Viewport } from "next";
import { Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SpaceKeyFix } from "@/components/SpaceKeyFix";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://plify.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Plify - Métricas, Propostas e Sua Página",
  description: "Plataforma SaaS leve: dashboard de anúncios Meta, templates de proposta e mini-site da sua empresa. Planos gratuitos e Pro.",
  manifest: "/manifest.json",
  icons: {
    icon: "/plify.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Plify",
  },
  openGraph: {
    title: "Plify - Métricas, Propostas e Sua Página",
    description: "Plataforma SaaS leve: dashboard de anúncios Meta, templates de proposta e mini-site da sua empresa. Planos gratuitos e Pro.",
    url: siteUrl,
    siteName: "Plify",
    images: [
      {
        url: "/plify.png",
        width: 1200,
        height: 630,
        alt: "Plify - Métricas, Propostas e Sua Página",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plify - Métricas, Propostas e Sua Página",
    description: "Plataforma SaaS leve: dashboard de anúncios Meta, templates de proposta e mini-site da sua empresa.",
    images: ["/plify.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${syne.variable} ${jetbrains.variable} antialiased font-sans`}>
        <SpaceKeyFix />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
