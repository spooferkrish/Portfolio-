import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La boîte à slides — Agence PowerPoint",
  description: "La boîte à slides, agence PowerPoint et activateur d’impact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
