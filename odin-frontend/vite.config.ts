import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react() // Only React plugin; remove Replit plugins
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),       // Adjust to your frontend src
      "@shared": path.resolve(__dirname, "../shared"), // Shared folder if needed
      "@assets": path.resolve(__dirname, "../attached_assets"),
    },
  },
  root: path.resolve(__dirname), // frontend root folder
  build: {
    outDir: path.resolve(__dirname, "dist"), // Vercel serves from /dist
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,   // Vite default port
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
