# Expenser

Expense tracker. Next.js (App Router) full stack, Clerk auth, Postgres (Docker locally / Neon in production), Drizzle ORM, Tailwind, i18n (Spanish default, English).

[![CI](https://github.com/carlCarlson6/expenser/actions/workflows/ci.yml/badge.svg)](https://github.com/carlCarlson6/expenser/actions/workflows/ci.yml)

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, RSC, Server Actions) |
| Auth | Clerk (`@clerk/nextjs`), profiles synced lazily on first read |
| Database | Postgres 16 via Docker (local) / Neon (production) |
| ORM | Drizzle (`drizzle-orm`, `drizzle-kit`) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Validation | Zod (v4) |
| i18n | next-intl (`es` default, `en`), locale-prefixed routes |
| Tests | Vitest: pure unit suites + integration suites on a Testcontainers Postgres |

## Architecture

Vertical slices with a query/command (CQS) core. Each slice owns its table, its
domain rules and its UI; Server Actions are a thin transport layer on top.

```
src/
├── proxy.ts                  # Clerk auth + next-intl locale routing (Next 16 renamed middleware → proxy)
├── i18n/                     # routing config, navigation helpers, request config
├── messages/                 # es.json / en.json translation catalogs
├── app/
│   ├── [locale]/             # routes only: layout + (auth) + (app) pages
│   └── api/admin/            # POST /api/admin — key-guarded command endpoint
├── modules/
│   ├── users/                # profile provisioning, settings (locale, currency)
│   ├── categories/           # category CRUD, default seed, delete→reassign
│   ├── expenses/             # expense CRUD, paginated filtered list
│   ├── reports/              # read-only aggregations powering the dashboard
│   └── admin/                # cross-cutting: admin commands (migrate, seed-dev-user)
│       ├── commands.ts       # command registry (zod params + runner)
│       └── domain/           # commands/ (writes) · seed-rules (deterministic dev data)
│       └── <slice>/
│           ├── domain/       # commands/ (writes) · queries/ (reads) · validators/ · types
│           ├── data/         # drizzle table + repository (+ interfaces)
│           ├── actions.ts    # Server Actions: FormData → zod → auth → command
│           └── ui/           # components
└── shared/
    ├── db/                   # driver factory (postgres-js local / neon-websocket prod), repo composition
    ├── money/                # cents parsing/formatting, date formatting
    ├── auth/                 # Clerk helpers + admin key check
    ├── ui/                   # presentational primitives (button, field, modal, action-form)
    └── testing/              # `server-only` stub used by the Vitest alias

test/                        # unit/ and integration/ mirror the src/ structure
├── setup/                   # Vitest globalSetup: Testcontainers Postgres
├── unit/
│   ├── modules/
│   │   ├── categories/data/palette.test.ts
│   │   ├── categories/domain/validators/category.test.ts
│   │   ├── expenses/domain/validators/expense.test.ts
│   │   ├── reports/domain/dates.test.ts
│   │   ├── reports/domain/period.test.ts
│   │   ├── reports/domain/stacked.test.ts
│   │   └── reports/ui/chart.test.ts
│   └── shared/
│       ├── auth/admin.test.ts
│       └── money/money.test.ts
└── integration/              # real repositories, real Postgres
    ├── modules/
    │   ├── admin/domain/commands/seed-dev-user.test.ts
    │   ├── categories/domain/commands/categories.test.ts
    │   ├── expenses/domain/commands/expenses.test.ts
    │   ├── reports/domain/queries/get-dashboard-data.test.ts
    │   └── users/domain/queries/get-profile.test.ts
    └── shared/db/
        ├── db-live.test.ts   # end-to-end flow on one tenant
        └── fixtures.ts       # real-repo test context (fresh tenant per test)
```

`unit/` holds pure logic (no database, no Docker); `integration/` holds the
repo- and flow-level suites. There are no fake repositories: integration tests
run against the real Drizzle repositories on an ephemeral Postgres.
`test/setup/global-db.ts` (a Vitest `globalSetup` scoped to the integration
project) starts a `postgres:16-alpine` container and applies the migrations,
and `test/setup/db-env.ts` points `DATABASE_URL` at it inside each worker.
Tests isolate themselves by tenant: `fixtures.ts` provisions a fresh profile
(with its default categories) per test case and cleans them up afterwards.

Rules of the road:

- **Commands mutate, queries read.** Both take repositories + an `Actor`
  (the caller's profile) and enforce business rules; they never read cookies
  or auth directly.
- **Actions are thin**: parse `FormData` → zod → `auth()` → command/query →
  `revalidatePath("/[locale]", "layout")` → typed `ActionResult`.
- **Server Actions must always authorize**: every domain function scopes reads
  and writes by `actor.profileId`, so cross-user access is impossible even if a
  route is hit directly.
- **Money is integer cents** everywhere; only `shared/money` converts/format.
- **Database** driver is picked from `DATABASE_URL` (`neon.tech` → Neon over
  WebSockets). Neon also has an HTTP driver, but it cannot open a transaction,
  and deleting a category / seeding a profile both need one.
- **Tests live in `/test`**, mirroring the `/src` tree (`test/modules/expenses/…`
  tests `src/modules/expenses/…`). Nothing under `src/` is test-only. Tests
  import production code through the `@/` alias and test helpers through the
  `@test/` alias, never through relative paths, so moving a test never breaks
  its imports.

### Key flows

- **First sign-in**: `getProfile` (query) finds no profile → creates one and
  seeds the 10 default categories (last one protected: the "Other" bucket).
  No Clerk webhooks needed for the MVP.
- **Deleting a category**: runs in a transaction — expenses are reassigned to
  the protected category, then the category is deleted. The protected category
  cannot be deleted or renamed into conflict.
- **Language**: stored on the profile; the URL prefix drives rendering
  (Spanish is unprefixed). If they disagree (e.g. new device), the app layout
  redirects once to the profile's locale.
- **Dashboard is the only analytics surface**: period presets (this month by
  default, then 30 days / 6 months / 12 months / custom), granularity
  (day/week/month) and an optional category filter drive one query; the summary
  cards, chart, category table and recent list all reflect the same selection.
- **A preset implies its own bucket size** (this month / 30 days → day, 6 months
  → week, 12 months → month) so no window collapses into a single bar; an
  explicit grouping always wins and is the only one kept in the URL.
- **Chart shape is presentation state**: the `?chart=` param picks bars,
  line, area, cumulative or a by-category donut. It never changes what the
  query aggregates, so switching shape keeps the period untouched and the
  param stays out of the domain layer.

## Getting started

Requirements: Node 20.9+, Docker (local Postgres and the Testcontainers
instance behind `npm test`).

```bash
npm install
cp .env.example .env.local   # add your real Clerk keys
npm run db:up                # start Postgres on :5432
npm run db:migrate           # apply migrations
npm run dev                  # http://localhost:3000 (redirects to /sign-in)
```

### Clerk setup

1. Create an app at <https://dashboard.clerk.com>.
2. Copy **Publishable key** and **Secret key** into `.env.local`
   (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`).
3. Leave sign-in/sign-up enabled (the app hosts both routes under `[locale]`).

Without valid keys every protected route returns 500 — that is Clerk rejecting
the placeholder keys, not an app error.

### Production (Vercel + Neon)

1. Create a Neon database, set `DATABASE_URL` in the Vercel project.
   Hostnames containing `neon.tech` automatically use the Neon WebSocket
   driver. That driver needs a global `WebSocket`, so the runtime must be
   Node 22+ (Vercel's default; `npm run build` already requires it).
2. Set the Clerk keys in Vercel (same names as above).
3. `npm run db:migrate` locally against the Neon URL (or run it in CI) — the
   driver factory supports it unchanged.

## Scripts

| Script | Purpose |
| --- | --- |
| `dev` / `build` / `start` | Next.js |
| `lint` / `typecheck` | ESLint, `tsc --noEmit` |
| `test` / `test:watch` | Vitest, both projects (unit + integration) |
| `test:unit` | Pure unit tests from `test/unit/` (no Docker) |
| `test:integration` | `test/integration/` suites against a Testcontainers Postgres (Docker required) |
| `db:up` / `db:down` | Start/stop the Postgres container |
| `db:generate` / `db:migrate` | Drizzle migration generate/apply |
| `db:studio` | Drizzle Studio |
| `db:seed` | Seed a dev profile straight against the database |
| `admin` | Call the admin endpoint (`npm run admin -- migrate`) |

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key |
| `CLERK_SECRET_KEY` | Clerk backend key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `ADMIN_API_KEY` | Key for `POST /api/admin`; unset disables it (503) |
| `ADMIN_API_URL` | Base URL used by `npm run admin` (default `http://localhost:3000`) |
| `SEED_CLERK_USER_ID` | Default clerk user for the seed command |

### Admin API

`POST /api/admin` runs one **command** picked from the JSON body. It is
authenticated with the `x-admin-key` header (constant-time compared), not with
Clerk — `src/proxy.ts` keeps `/api/*` out of the locale/auth chain.

```bash
curl -X POST localhost:3000/api/admin -H "x-admin-key: $ADMIN_API_KEY" \
  -H 'content-type: application/json' -d '{"command":"migrate"}'
```

| Command | Params | What it does |
| --- | --- | --- |
| `migrate` | `folder?` | Applies pending Drizzle migrations from `./drizzle`, using the same driver as the app (postgres-js / Neon WebSocket). Returns `{driver, total, applied}`. |
| `seed-dev-user` | `clerkUserId?`, `force?`, `months?` | Provisions the profile and fills it with plausible expenses. `clerkUserId` falls back to `SEED_CLERK_USER_ID`; refuses a non-empty profile unless `force` (409). |

Responses are `{ok: true, command, result}`; errors are `{ok: false, error}`
with `401` (bad key), `503` (no `ADMIN_API_KEY`), `400` (bad body/params),
`404` (unknown command) or `409` (`alreadySeeded`).

`npm run admin -- <command>` is a thin client over the same endpoint. To add a
command: drop it in `src/modules/admin/domain/commands/`, give it a zod schema
and register it in `src/modules/admin/commands.ts` — the route, the CLI and the
error mapping need no changes.

Caveat: `migrate` reads `./drizzle` from disk, which serverless platforms do
not bundle by default — on Vercel keep using `npm run db:migrate` from CI.

## Known MVP limitations

- Changing the currency does not convert already-recorded expenses.
- Expenses have day granularity (no time of day).
- Lazy profile provisioning runs a read+insert on first request per user; a
  Clerk webhook is the production-hardening path if that matters at scale.
