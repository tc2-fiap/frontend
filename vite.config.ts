import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
