import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Backlink Bazaar",
  description: "Backlink Exchange Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}

