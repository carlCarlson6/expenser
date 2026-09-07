# IDEA 01 — Export user transactions as CSV

## Status

Approved. Ready for implementation.

## Overview

Add a CSV export of all transactions for the logged-in user (all-time, single file),
with the category name inlined, amounts in EUR with dot-decimal, and dates in ISO
format. Triggered from the Transactions page as a browser download.

## Locked decisions

| Decision | Choice |
| --- | --- |
| Data included | All transactions for the logged-in user, all-time |
| Format | CSV (`.xlsx` reserved for a future iteration) |
| File count | 1 |
| Amount format | EUR decimal, e.g. `12.34`, **always positive** |
| Sign handling | Separate `type` column (`expense` \| `income`) |
| Date format | ISO `YYYY-MM-DD` |
| Date ordering | Descending (newest first) — implementation default |
| Delivery | Browser download, synchronous |
| Security extras | None for now; documented as future work |
| Direction | One-way export only |
| UI location | Transactions page, near the month picker |
| Button | "Export CSV" with `<Download>` icon, outline style |
| Filename | `expenser-transactions-YYYY-MM-DD.csv` (current date) |

## CSV schema

```csv
date,type,amount_eur,category_name,note
2026-09-01,expense,12.34,Groceries,Weekly shopping
2026-09-02,income,1500.00,,Salary
```

- `category_name` is empty for income and for any orphaned expense.
- `note` is empty when absent.
- Fields are quoted/escaped when they contain `,`, `"`, or newlines per RFC-4180.

## Architecture

Fits the existing hexagonal layers:

- **Application**: `export-transactions.query.ts` returns a
  `TransactionExportRowDto[]` through the existing read-model port.
- **Infrastructure**: extend `DrizzleTransactionReadModel` with an all-time fetch
  that joins `transactions` with `categories`.
- **Driving adapter (app)**: new Server Action builds the CSV string and returns
  `{ csv, filename }`; a small client component triggers the browser download.
- **Composition**: wire the new query into `ledger-composition.ts`.
- **UI**: add an outline button on `/transactions`, near the month navigation.

## Files to create

| File | Purpose |
| --- | --- |
| `src/modules/ledger/application/transaction-export.dto.ts` | `TransactionExportRowDto` type |
| `src/modules/ledger/application/queries/export-transactions.query.ts` | Application query function |
| `src/app/actions/export-transactions.action.ts` | Server action: auth → query → CSV |
| `src/app/(app)/transactions/_components/export-transactions-button.tsx` | Client download button |

## Files to modify

| File | Change |
| --- | --- |
| `src/modules/ledger/application/transaction.dto.ts` | Add `findAllByUser(userId): Promise<TransactionListItemDto[]>` to `TransactionReadModel` |
| `src/modules/ledger/infrastructure/drizzle-transaction.read-model.ts` | Implement `findAllByUser` (all user transactions, joined with categories, ordered by date DESC) |
| `src/composition/ledger-composition.ts` | Expose `ledger.export(userId)` composing the new query |
| `src/app/(app)/transactions/page.tsx` | Add `<ExportTransactionsButton />` next to the month picker |
| `README.md` | Add future-work note: rate-limiting, audit logging, `.xlsx` export |

## Implementation steps

1. **Extend read model**
   - Add `findAllByUser(userId)` to `TransactionReadModel`.
   - Implement in `DrizzleTransactionReadModel`: select from `transactions`, left
     join `categories`, filter by `userId`, order by `date DESC`.

2. **Add application query**
   - Create `TransactionExportRowDto`.
   - Create `exportTransactions({ userId, readModel })` which calls
     `readModel.findAllByUser` and maps each item to the DTO, formatting
     `amount_eur` with `Money.reconstitute(cents).toEuros().toFixed(2)`.

3. **Add Server Action**
   - `exportTransactionsAction()`: auth check, call `ledger.export(userId)`,
     build CSV string with header + escaping helper, return
     `{ csv, filename: "expenser-transactions-YYYY-MM-DD.csv" }`.

4. **Add client button**
   - Fetch via the action on click, create a `Blob`, and programmatically
     download with the generated filename. Show loading / empty states.

5. **Wire composition & page**
   - Expose `ledger.export(userId)` in `ledger-composition.ts`.
   - Place the button on the Transactions page near the month navigation.

6. **Tests**
   - Unit test the CSV escaping helper (comma, quote, newline).
   - Unit test the export query mapping with an in-memory read-model stub.

7. **README update**
   - Add a "Future work" note: rate-limit exports, audit log, `.xlsx`/multi-format
     export.

## Future work / open iterations

- `.xlsx` export.
- Export rate-limiting per user.
- Audit log of exports.
- Date-range filtering (e.g. current month only).
- Import functionality (out of scope; would require separate design).
