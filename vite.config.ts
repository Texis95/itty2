import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
  alias: {
    "@": path.resolve(process.cwd(), "client", "src"),
    "@shared": path.resolve(process.cwd(), "shared"),
    "@assets": path.resolve(process.cwd(), "attached_assets"),
  },
},
root: path.resolve(process.cwd(), "client"),
build: {
  outDir: path.resolve(process.cwd(), "dist/public"),
  emptyOutDir: true,
},
});
