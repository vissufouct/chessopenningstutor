import { defineConfig } from "vite";
export default defineConfig({
  base: process.env.GITHUB_ACTIONS === "true" ? "/chessopenningstutor/" : "/",
  server: { host: "0.0.0.0", allowedHosts: ["terminal.local"] },
  build: { outDir: "dist/client" },
});
