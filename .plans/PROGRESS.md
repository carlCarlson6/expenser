# Expenser Implementation Progress

> Last updated: 2026-09-05

This file tracks progress against the POC plan defined in `README.md`.

## POC Steps

### 0. Bootstrap — DONE
- Next.js 16 (App Router, TypeScript, Tailwind v4, Turbopack)
- ESLint, Vitest, shadcn/ui
- Folder skeleton, path aliases, Clerk proxy
- Hello-world build passes

### 1. Infrastructure — DONE
- Drizzle ORM configured (`drizzle.config.ts`)
- Local Postgres via Docker (`scripts/db.sh`)
- Clerk app + proxy, protected `(app)` routes via `auth.protect()`
- Migrations run clean

### 2. Shared kernel — DONE
- `Money` (integer cents, EUR formatting)
- `YearMonth` (parse/compare/range)
- `Result` type
- `Entity` base
- Unit tests for `Money` and `YearMonth`

### 3. Categories slice — DONE
- Schema + migration (`categories` table)
- Domain: `Category` entity with validation
- Application: list, create, update, delete, seed-defaults use cases
- Infrastructure: `DrizzleCategoryRepository`
- Composition root + server actions (Zod-validated)
- Categories settings page (CRUD + default-category seeding on dashboard load)
- Domain + application tests
- Delete guard wired to ledger transaction count

### 4. Ledger slice — DONE
- Schema + migration (`transactions` table)
- Domain: `Transaction` aggregate with invariants
  - amount > 0
  - expense must have a category
  - income must not have a category
- Application: create, update, delete, list-for-month use cases
- Infrastructure: `DrizzleTransactionRepository`, `DrizzleTransactionReadModel`
- Composition root + server actions
- Transactions page with month picker, grouped list, add/edit/delete dialogs
- Domain + application tests

### 5. Budgets slice — DONE
- Schema + migration (`budgets` table)
- Domain: `Budget` aggregate + `BudgetStatus` domain service
- Application: set-budget (upsert), delete-budget, list-budget-statuses-for-month
- Infrastructure: `DrizzleBudgetRepository`
- Cross-context read model for actual spending via ledger
- Composition root + server actions
- Budgets page with month picker, per-category planned inputs, progress bars, over-budget state
- Domain + application tests

### 6. Dashboard & charts — PENDING
- Read-model queries for summary cards:
  - total spent
  - total income
  - net
  - remaining budget
- Category donut chart
- Budget-vs-actual bars
- 6-month trend chart
- Pacing line with today marker
- Empty states

### 7. Ship — PENDING
- Mobile-responsive pass
- Loading/error states
- Full test run
- Clerk production instance
- Vercel project + environment wiring
- Deploy + real-usage smoke test

## Verification Status

| Check | Status |
| --- | --- |
| `npm test` | 83 tests passing |
| `npm run typecheck` | clean |
| `npm run lint` | clean |
| `npm run build` | succeeds |
| `npm run db:migrate` | applied successfully |

## Next Actions

1. Build dashboard read-model query service (aggregate spending, income, net, remaining).
2. Add charts using Recharts via shadcn Chart component.
3. Implement empty states and loading skeletons.
4. Run mobile/responsive pass.
5. Prepare Clerk production + Vercel deployment.
