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
    "/auth": { target: authTarget, changeOrigin: true, configure },
  };
};

function resolveClientSecretForApp(env: Record<string, string>): string {
  return (
    env.VITE_CLIENT_SECRET?.trim() ||
    process.env.VITE_CLIENT_SECRET?.trim() ||
    env.KEYCLOAK_CLIENT_SECRET?.trim() ||
    process.env.KEYCLOAK_CLIENT_SECRET?.trim() ||
    ""
  );
}

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, workspaceRoot);
  const viteClientSecret = resolveClientSecretForApp(env);

  if (mode === "development" && !viteClientSecret) {
    console.warn(
      "[vite] VITE_CLIENT_SECRET is empty — login will not send client_secret. " +
        "Add VITE_CLIENT_SECRET=... to a root .env file (see .env.example) and restart dev.",
    );
  }

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

  /** Vite `base` for built asset URLs and `import.meta.env.BASE_URL`. Default `/` for root hosting. */
  const rawBase = (env.VITE_BASE_PATH ?? process.env.VITE_BASE_PATH ?? "/").trim();
  const base =
    rawBase === "" || rawBase === "/"
      ? "/"
      : `${rawBase.startsWith("/") ? "" : "/"}${rawBase}`.replace(/\/+$/, "") + "/";

  return {
    base,
    define: {
      "import.meta.env.VITE_CLIENT_SECRET": JSON.stringify(viteClientSecret),
    },
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
