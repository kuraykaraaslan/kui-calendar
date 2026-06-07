import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

/*
 * Demo-site build config (deployed to Vercel).
 *
 * Builds the repo-root `index.html` + `src/main.tsx` (plus the modules they
 * pull in) as a standalone static site, separate from the library build in
 * `vite.config.ts`. Everything is bundled so Vercel serves a single,
 * self-contained site.
 *
 * Output: `dist-demo/`
 */
export default defineConfig({
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
  build: {
    outDir: "dist-demo",
    emptyOutDir: true,
    target: "es2022",
    sourcemap: false,
  },
});
