import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared/src"),
    },
  },
  server: {
    port: 5173,
    // API calls go to the Express server; keeps the client origin clean in dev.
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      // Open Food Facts sends no CORS headers, so the browser cannot call it
      // directly. Proxied in dev; this moves behind our own Express route
      // (with caching and rate-limit handling) once the server exists.
      // Note the distinct prefixes: Vite matches proxy keys by prefix, so a
      // "/off" rule would also swallow "/offapi" and rewrite it into nonsense.
      "/off-search": {
        target: "https://search.openfoodfacts.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/off-search/, ""),
      },
      // Barcode lookups live on the main site, not the search service, and are
      // not subject to the search rate limit.
      "/off-product": {
        target: "https://world.openfoodfacts.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/off-product/, ""),
      },
    },
  },
});
