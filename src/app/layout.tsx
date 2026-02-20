import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "@/providers/QueryProvider";
import { Toaster } from "@/components/ui/toaster";
import { SpaceKeyFix } from "@/components/SpaceKeyFix";

export const metadata: Metadata = {
  title: "Plify - Gestão e Propostas",
  description: "Sistema completo de gestão: clientes, propostas, projetos, agenda, ads e mais.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Plify" },
  icons: {
    icon: "/logopreto.ico",
    shortcut: "/logopreto.ico",
    apple: "/logopreto.png",
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
        <SpaceKeyFix />
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
