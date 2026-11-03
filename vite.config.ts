import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During dev, proxy /api to the backend so cookies work on the same origin.
// In production, Nginx serves the built frontend AND proxies /api → backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL ?? "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
