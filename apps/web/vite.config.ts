import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_DEV_PROXY_TARGET ?? "http://localhost:8080";

  return {
    plugins: [
      TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
      paraglideVitePlugin({
        project: "./project.inlang",
        outdir: "./src/paraglide",
        strategy: ["localStorage", "preferredLanguage", "baseLocale"],
        emitTsDeclarations: true,
      }),
      react(),
      tailwindcss(),
    ],
    server: {
      host: true,
      allowedHosts: true,
      proxy: {
        "/api/bilibili": {
          target: "https://api.bilibili.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/bilibili/, ""),
          headers: {
            Authorization: "",
            Cookie: "",
            Referer: "https://space.bilibili.com/",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        },
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          rewrite:
            apiTarget.includes("localhost") || apiTarget.includes("127.0.0.1")
              ? (path) => path.replace(/^\/api/, "")
              : undefined,
          ws: true,
        },
        "/proxy": {
          target: apiTarget,
          changeOrigin: true,
        },
        "/streams": {
          target: apiTarget,
          changeOrigin: true,
        },
        "/sabr": {
          target: apiTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
