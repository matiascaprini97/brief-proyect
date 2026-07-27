import type { NextConfig } from "next";
import "dotenv/config"; // Cargamos el .env acá arriba

const nextConfig: NextConfig = {
  /* Opciones de configuración modernas */
  env: {
    // Esto le grita a Turbopack que exponga la URL globalmente
    DATABASE_URL: process.env.DATABASE_URL,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // 👈 Aumentamos el límite para imágenes y archivos
    },
  },
};

export default nextConfig;