import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "modules/index.ts",
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: [
        "zustand",
        "zustand/vanilla",
        "zustand/middleware",
        "clsx",
        "tailwind-merge",
        "@fortawesome/fontawesome-svg-core",
        "@fortawesome/free-solid-svg-icons",
      ],
    },
    target: "es2022",
    sourcemap: true,
  },
});
