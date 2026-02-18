import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SpaceKeyFix } from "@/components/SpaceKeyFix";

export const metadata: Metadata = {
  title: "Plify - Gestão e Propostas",
  description: "Sistema completo de gestão: clientes, propostas, projetos, agenda, ads e mais.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Plify" },
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
