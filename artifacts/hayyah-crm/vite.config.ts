import { defineConfig, loadEnv, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT ?? "3000";
const port = Number(rawPort);
const workspaceRoot = path.resolve(import.meta.dirname, "..", "..");

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const apiProxy = (apiTarget: string, authTarget: string): Record<string, ProxyOptions> => {
  const configure: ProxyOptions["configure"] = (proxy) => {
    proxy.on("proxyRes", (proxyRes, req) => {
      const code = proxyRes.statusCode ?? 0;
      if (code >= 400) {
        const target = (req.url ?? "").startsWith("/auth") ? authTarget : apiTarget;
        console.warn(
          `[vite proxy] ${req.method} ${req.url} → HTTP ${code} (target: ${target})`,
        );
      }
    });
    proxy.on("error", (err) => {
      console.error("[vite proxy]", err.message);
    });
  };

  return {
    "/api": { target: apiTarget, changeOrigin: true, configure },
    "/frontend/api": {
      target: apiTarget,
      rewrite: (p: string) => p.replace(/^\/frontend\/api/, "/api"),
      changeOrigin: true,
      configure,
    },
    "/auth": { target: authTarget, changeOrigin: true, configure },
  };
};

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, workspaceRoot);
  // Default to deployed API so dev works without a local backend on :8080 (avoids proxy → localhost:8080 → 404 on /api/v1/*).
  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET ??
    process.env.VITE_API_PROXY_TARGET ??
    "https://hayyah.me";
  const authProxyTarget =
    env.VITE_AUTH_PROXY_TARGET ??
    process.env.VITE_AUTH_PROXY_TARGET ??
    apiProxyTarget;

  // One-line sanity check when debugging “all APIs 404” locally.
  console.info(`[vite] proxy /api → ${apiProxyTarget}  |  /auth → ${authProxyTarget}`);

  return {
    base: "/frontend/",
    plugins: [
      react(),
      tailwindcss(),
      runtimeErrorOverlay(),
      ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer({
                root: path.resolve(import.meta.dirname, ".."),
              }),
            ),
            await import("@replit/vite-plugin-dev-banner").then((m) =>
              m.devBanner(),
            ),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(
          import.meta.dirname,
          "..",
          "..",
          "attached_assets",
        ),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    envDir: workspaceRoot,
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
      proxy: apiProxy(apiProxyTarget, authProxyTarget),
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
      proxy: apiProxy(apiProxyTarget, authProxyTarget),
    },
  };
});
