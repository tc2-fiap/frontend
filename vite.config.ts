import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import packageJson from './package.json' with { type: 'json' };

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Baked into the static bundle at build time (Vite substitutes this as
  // raw source text, hence JSON.stringify) — shown in the nav (NavBar.tsx).
  // Read directly from package.json rather than an env var, so it's always
  // in sync with whatever that file says and needs no --build-arg to work.
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  server: {
    // Local dev only — proxies to the kind cluster's ingress (host port
    // 80) so the app can use the same relative /api/* paths it uses in
    // production, with no service-specific host/port baked into the build.
    proxy: {
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
      },
    },
  },
});
