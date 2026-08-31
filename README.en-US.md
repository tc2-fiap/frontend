**English** · [Português](README.pt-BR.md)

# FIAP Games — Frontend

React + Vite + TypeScript. Talks to every backend through one relative base URL (`/api/*`) — the Ingress routes by path, so this app never needs a service-specific port or host. See [`../documentation/spec/instructions.md`](../documentation/spec/instructions.md) §7 (the `documentation` repo is also published at [github.com/tc2-fiap/documentation](https://github.com/tc2-fiap/documentation)).

## Run standalone

Fastest loop, needs a backend reachable at `localhost:80` (e.g. the kind cluster's ingress):

```bash
npm install
npm run dev
```

`vite.config.ts` proxies `/api/*` to `http://localhost:80` in dev.

Or, to prove the built container serves correctly on its own (no dev-time proxy):

```bash
docker compose up --build
```

## Run as part of the system

Deployed by the [`orchestration`](https://github.com/tc2-fiap/orchestration) Helm chart alongside the five backend services — see `repos/orchestration`.

## What's here

- `src/api/` — fetch client, typed endpoint calls, response DTOs matching the backends' shapes.
- `src/auth/` — JWT storage + a client-side JWT decoder used only for UI gating (e.g. showing the admin nav link); the actual authorization decision always happens server-side.
- `src/i18n/` — `LocaleContext`/`useLocale()` (mirrors `AuthContext`'s shape) driving the header's EN/PT language toggle, plus the `en`/`pt` translation dictionaries and `locale-currency.ts` (`en → USD`, `pt → BRL`). Persisted in `localStorage`; defaults to English.
- `src/utils/currency.ts` — `formatPrice(value, currency)` (BRL via `pt-BR`/`Intl.NumberFormat`, USD via `en-US`, defaulting to BRL) and `brlToUsd()`. Every backend price is still a plain BRL number — `src/hooks/useQuotation.ts` fetches [`catalog-api`](https://github.com/tc2-fiap/catalog-api)'s live rate once per page load and the catalog page converts for display only when the toggle is English, degrading to native BRL if the rate is unavailable.
- `src/pages/` — register/login (including a conditionally-rendered Google sign-in button — see `GET /api/users/config`), catalog (with cover images, falling back to a letter tile when a game has none), the checkout/order-status page (product line item, dual-currency price, PIX QR when a real gateway is active, polls while `Pending`), library, and three admin views: all-orders, per-order cross-service audit trail, and `AdminEventsPage.tsx` at `/admin/events` — every event/message across all services, filterable by source/kind/type/date, composed from four admin endpoints via `Promise.allSettled` the same way the per-order page is (`../documentation/spec/notes.md` 43).
- `src/utils/formatJson.ts` — the JSON-pretty-print-with-fallback helper shared by the per-order and system-wide admin pages.
- Brand assets (`theme.css`, `Logo.tsx`, `public/favicon.svg`) are lifted verbatim from this repo's own `design/` — see `design/style-guide.md` and `../documentation/spec/notes.md` 31.

## Build

```bash
npm run build   # tsc -b && vite build
npm run lint    # oxlint
```
