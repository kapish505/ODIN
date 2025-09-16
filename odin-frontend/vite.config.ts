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


  root: __dirname,      // points to repo root containing index.html
  build: {
    outDir: path.resolve(__dirname, "dist"), // output folder for Vercel
    emptyOutDir: true,
  },
});
