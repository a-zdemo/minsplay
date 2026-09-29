import { defineConfig } from "vite";

export default defineConfig({
  // Root directory where your source index.html lives
  root: "./",

  build: {
    // Keeps Render's publish directory intact
    outDir: "public/dist",
    emptyOutDir: true,
    rollupOptions: {
      input: "index.html",
    },
  },
});