import type { NextConfig } from "next";

const nextConfig = {
  typescript: {
    // Ignorar errores de TypeScript durante build (solo para desarrollo)
    ignoreBuildErrors: false,
  },
  experimental: {
    typedRoutes: false, // Deshabilitar rutas tipadas si causan problemas
  },
}


export default nextConfig;
