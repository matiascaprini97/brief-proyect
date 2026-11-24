import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PHIIT - Equipments",
  description: "Gestión digital de equipos mobile-first",
  applicationName: "PHIIT Equipments",
  appleWebApp: {
    capable: true,
    title: "PHIIT Equipments",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/uploads/BLACK.jpeg",
    apple: "/uploads/BLACK.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}