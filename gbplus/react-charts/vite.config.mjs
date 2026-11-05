import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Isolated IIFE: GB+ remains a vanilla JS PWA; React loads only on chart screens.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    target: "es2020",
    outDir: "../charts-dist",
    emptyOutDir: true,
    sourcemap: false,
    lib: {
      entry: "./src/main.tsx",
      name: "GBReactCharts",
      formats: ["iife"],
      fileName: () => "gb-react-charts.js",
      cssFileName: "gb-react-charts"
    }
  }
});
