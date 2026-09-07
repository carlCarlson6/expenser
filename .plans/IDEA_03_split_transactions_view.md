# IDEA 03 — Split transactions view

## Status

Approved. Ready for implementation.

## Overview

Restructure the `/transactions` page into a two-column desktop layout:

- **Left column**: month picker + transaction list (grouped by date).
- **Right column**: a persistent "Add transaction" form.

Editing a transaction continues to open the existing modal dialog. The standalone
"Add transaction" button in the page header is removed because the form is always
visible.

## Locked decisions

| Decision | Choice |
| --- | --- |
| Left column content | Month picker + month-grouped transaction list |
| Right column content | Persistent "Add transaction" form |
| Editing flow | Keep existing modal (`TransactionActions` unchanged) |
| Header "Add transaction" button | Remove |
| Month picker placement | Above the left list |
| Layout ratio | ~2:1 in favor of the list (e.g. `lg:grid-cols-3` with list spanning 2) |
| Right column behavior | Sticky while scrolling the list |
| Mobile behavior | Out of scope; keep a safe responsive stack (`flex-col lg:flex-row`) |

## Architecture

No backend changes. Purely a layout refactor of the transactions page.

- The page remains a Server Component that fetches categories and transactions.
- `TransactionForm` is reused on the right as the add form.
- `TransactionActions` (edit/delete dropdown + modal) is reused in the list.

## Files to modify

| File | Change |
| --- | --- |
| `src/app/(app)/transactions/page.tsx` | Replace single-column layout with two-column layout; remove "Add transaction" dialog button; render `<TransactionForm action={createTransactionAction} … />` on the right |

## Files unchanged

| File | Reason |
| --- | --- |
| `src/app/(app)/transactions/_components/transaction-form.tsx` | Reused as-is for adding |
| `src/app/(app)/transactions/_components/transaction-actions.tsx` | Editing stays in modal |

## Implementation steps

1. **Remove the add-transaction dialog from the header**
   - Keep the page title and subtitle.
   - Remove the `<Dialog>` wrapping the "Add transaction" `<Button>` and the
     `<Plus>` icon trigger.

2. **Create the two-column layout**
   - Wrap the page content in a container such as:
     ```tsx
     <div className="flex flex-col gap-6 lg:flex-row">
       {/* left column */}
       <div className="flex-[2] space-y-6">
         …month picker + transaction list…
       </div>

       {/* right column */}
       <div className="flex-1">
         <Card className="sticky top-6">
           <CardHeader>
             <CardTitle>Add transaction</CardTitle>
           </CardHeader>
           <CardContent>
             <TransactionForm
               action={createTransactionAction}
               categories={categoryList}
               submitLabel="Add transaction"
             />
           </CardContent>
         </Card>
       </div>
     </div>
     ```
   - The right card should be `sticky top-6` so it remains accessible while the
     user scrolls through a long transaction list.

3. **Keep the month picker and list intact**
   - The month navigation and grouped transaction list move into the left column
     unchanged.
   - The export button from IDEA 01 should live in the left column near the month
     picker.

4. **Verify responsive stacking**
   - On viewports below the `lg` breakpoint the columns stack vertically with the
     form above the list. This is acceptable because mobile UX is explicitly out
     of scope for this iteration.

5. **Smoke test**
   - Add a transaction from the right form → list refreshes and toast appears.
   - Edit a transaction from the list → modal opens, saves, list refreshes.
   - Delete a transaction → list refreshes.
   - Scroll a long list → right form stays sticky.

## Future work / open iterations

- Dedicated mobile layout (e.g. form collapsed behind a button, or bottom sheet).
- Consider populating the right form for editing instead of using a modal.
- Auto-focus amount input on page load for faster data entry.
