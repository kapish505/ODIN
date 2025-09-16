import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"), // optional
      "@assets": path.resolve(__dirname, "../attached_assets"), // optional
    },
  },
  root: path.resolve(__dirname), // root of frontend repo
  build: {
    outDir: path.resolve(__dirname, "dist"), // Vercel serves from /dist
    emptyOutDir: true,
  },
});
