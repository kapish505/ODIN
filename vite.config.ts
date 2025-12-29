import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@assets": path.resolve(__dirname, "src/assets"),
    },
  },
  root: path.resolve(__dirname), // points to odin-frontend folder
  build: {
    outDir: path.resolve(__dirname, "dist"), // output folder for Vercel
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": {
        target: "http://0.0.0.0:5000",
        changeOrigin: true,
      },
    },
  },
});
