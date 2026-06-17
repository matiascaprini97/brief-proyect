import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Importamos Inter en lugar de Geist
import "./globals.css";

// Configuramos la fuente Inter
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Plataforma QR - Camas de Pilates Guille",
  description: "Gestión digital de equipos mobile-first",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      {/* Aplicamos la clase de la fuente Inter al cuerpo de la app */}
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}