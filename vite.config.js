import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: { outDir: "docs" },
  esbuild: { jsx: "automatic" },
  // Dev only: the visitor pets API runs in PHP (npm run pets-api).
  server: { proxy: { "/pets-api": "http://127.0.0.1:8787" } },
});
