import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "react/index.ts",
      formats: ["es"],
      fileName: () => "react/index.js",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "zustand",
        "zustand/vanilla",
        "zustand/react",
        "zustand/middleware",
        "clsx",
        "tailwind-merge",
        "@fortawesome/fontawesome-svg-core",
        "@fortawesome/free-solid-svg-icons",
        "@fortawesome/react-fontawesome",
        "@kuraykaraaslan/kui-calendar",
      ],
      output: { preserveModules: false },
    },
    outDir: "dist",
    emptyOutDir: false,
    target: "es2022",
    // No source map: a map carries the original source (sourcesContent). scripts/check-pack-contents.mjs keeps it so.
    sourcemap: false,
  },
});
