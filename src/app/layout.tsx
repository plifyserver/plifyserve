import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryProvider } from "@/providers/QueryProvider";
import { Toaster } from "@/components/ui/toaster";
import { SpaceKeyFix } from "@/components/SpaceKeyFix";
import { FaviconFix } from "@/components/FaviconFix";

export const metadata: Metadata = {
  title: "Plify - Gestão e Propostas",
  description: "Sistema completo de gestão: clientes, propostas, projetos, agenda, ads e mais.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Plify" },
  icons: {
    icon: "/icone-site.ico",
    shortcut: "/icone-site.ico",
    apple: "/icone-site.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#3B82F6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <FaviconFix />
        <SpaceKeyFix />
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
