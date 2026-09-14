/// <reference types="vite/client" />

// Injected by vite.config.ts's `define` block, read straight from
// package.json's own "version" field — see NavBar.tsx for where it renders.
declare const __APP_VERSION__: string;

// Injected the same way — the exact commit/time this bundle was built
// from, computed inside the Dockerfile via `git rev-parse HEAD`. See
// AdminSystemHealthPage.tsx.
declare const __BUILD_SHA__: string;
declare const __BUILD_TIME__: string;
