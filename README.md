# Expenser

A personal expense tracking app. Log expenses and income, organize spending with your own categories, set monthly budgets per category, and visualize where your money goes with charts and diagrams.

## Tech Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, TypeScript, Turbopack) |
| Hosting | Vercel |
| Database | Neon (serverless Postgres); local Postgres via Docker |
| DB Driver | `pg` (node-postgres) over TCP — works for both local Docker and Neon pooled |
| ORM | Drizzle |
| Auth | Clerk |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Charts | Recharts (via shadcn Chart) |
| Tests | Vitest (domain + application layers) |

## Architecture

The codebase follows **Domain-Driven Design with full hexagonal architecture** (ports & adapters). Dependencies point inward only: `infrastructure → application → domain`. The domain layer is pure TypeScript with zero library imports, making business rules trivially unit-testable.

### Bounded Contexts

- **`ledger`** — `Transaction` aggregate (expense/income). Invariants: amount > 0; an expense *must* have a category; income *must not*.
- **`budgets`** — `Budget` aggregate (one per category per month) + `BudgetStatus` domain service (planned vs actual math, overspend rules).
- **`categories`** — `Category` entity (user-created, flat, name + color + icon). Invariant: a category in use cannot be deleted.
- **Identity** — deliberately thin: Clerk owns auth; there is no identity module. The Clerk `userId` is a text owner column on every table.

### Directory Layout

```
src/
├── app/                    # Next.js = driving adapter (pages, server actions)
│   ├── (auth)/             # sign-in, sign-up
│   ├── (app)/              # dashboard | transactions | budgets | categories
│   └── actions/            # server actions: zod-validate → call use case
├── modules/
│   ├── ledger/
│   │   ├── domain/         # entities, value objects, repository ports, errors
│   │   ├── application/    # use cases (commands/queries)
│   │   └── infrastructure/ # Drizzle repositories, table schema
│   ├── budgets/            # same structure
│   └── categories/         # same structure
├── shared/kernel/          # Money VO, YearMonth VO, Result type, Entity base
├── composition/            # composition root: wires Drizzle repos → use cases
└── db/                     # connection, drizzle.config, migrations
```

Rules: server actions never touch repositories directly (always through use cases); chart queries are read-model query services in the application layer (Drizzle aggregates, not loaded-through-repository aggregates).

## POC Plan

This section captures the initial plan agreed before implementation.

### Locked Decisions

| Decision | Choice |
| --- | --- |
| "Planned expenses" | Monthly budget limits per category (planned vs actual) |
| Architecture | Full hexagonal DDD |
| Tenancy | Personal only — Clerk `userId` as owner on every table |
| Done means | Deployed on Vercel + Neon + Clerk, usable on mobile |
| Categories | User-created, flat, name + color + icon, defaults seeded on first login |
| Transactions | Expenses + income; income has **no category** |
| Currency | EUR, stored as **integer cents** (`amount_cents`) — never floats |
| Charts | Category donut, budget-vs-actual, monthly trend, pacing line |
| Testing | Vitest unit tests on domain + application layers |
| Months | Calendar month in the user's browser timezone (`YYYY-MM` from client) |

### Data Model (3 tables)

- **`categories`**: `id` (`cat_…`), `user_id`, `name`, `color`, `icon`, timestamps
- **`transactions`**: `id` (`txn_…`), `user_id`, `type` (`expense` | `income`), `amount_cents` int, `date`, `category_id` (nullable FK; required for expenses by domain rule), `note`, timestamps
- **`budgets`**: `id` (`bud_…`), `user_id`, `category_id`, `year`, `month`, `amount_cents` + `uniqueIndex(user_id, category_id, year, month)` — upsert semantics for "set budget"

### Implementation Steps

Each step ends in a demo-able state.

0. **Bootstrap** — create-next-app (TS, App Router, Tailwind v4, strict), ESLint, Vitest, shadcn/ui init, folder skeleton + path aliases. *Exit: hello world deploys.*
1. **Infrastructure** — Drizzle + Neon serverless driver (local Docker Postgres in dev), Clerk app + proxy, all app routes protected. *Exit: sign in, empty shell, migrations run clean.*
2. **Shared kernel** — `Money` (integer cents, EUR formatting), `YearMonth` (parse/compare/range), `Result`, `Entity` base + unit tests.
3. **Categories slice** — schema + migration → domain + repo port → Drizzle repo → use cases → server actions → categories settings page (CRUD) → lazy idempotent default-category seeding on first dashboard load.
4. **Ledger slice** — transactions schema + migration → domain invariants → repo → use cases → actions → transactions page: month picker, grouped list, add/edit dialog (expense/income toggle), delete.
5. **Budgets slice** — budget schema + migration → domain + `BudgetStatus` service → upsert use case → budgets page: month picker, per-category planned amount, progress bars with over-budget state.
6. **Dashboard & charts** — read-model queries → dashboard: summary cards (spent / income / net / remaining), category donut, budget-vs-actual bars, 6-month trend, pacing line with today-marker. Empty states everywhere.
7. **Ship** — mobile-responsive pass, loading/error states, full test run, Clerk production instance, Vercel project (prod env → Neon `main`, previews → `dev`), deploy, real-usage smoke test. *Exit: track a real expense from your phone on the live URL.*

### Non-Goals (for the POC)

Multi-currency, recurring expenses, receipt uploads, shared households, income categories, CSV import/export, PWA install, E2E tests, domain events/outbox.

## Local Development

The app uses Neon in production, but local development runs against Postgres in Docker:

```bash
npm run db:up      # start Postgres 17 on localhost:5432 (db: expenser)
npm run db:down    # stop it
npm run db:reset   # wipe the volume and start fresh
```

Connection string for `.env.local`:

```
DATABASE_URL=postgresql://expenser:expenser@localhost:5432/expenser
DATABASE_URL_UNPOOLED=postgresql://expenser:expenser@localhost:5432/expenser
```

(Both are the same locally — the distinction only matters on Neon, where migrations must use the direct/unpooled endpoint.)

Then:

```bash
npm install
npm run db:migrate   # apply Drizzle migrations
npm run dev          # start the dev server
```
