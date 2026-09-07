# IDEA 02 — Left sidebar navigation with icons

## Status

Approved. Ready for implementation.

## Overview

Replace the current top header navigation with a fixed, icon-only left sidebar.
Hovering a nav item shows its label via a tooltip. The active route is highlighted
with a background and a left accent border. The Expenser logo and Clerk user button
move into the sidebar.

## Locked decisions

| Decision | Choice |
| --- | --- |
| Sidebar position | Sticky left, full viewport height |
| Width | Icon-only (`w-16` / 64 px) |
| Collapsible | No |
| Labels | Shown as tooltips on hover |
| Active indicator | Left accent border + `bg-accent` background |
| Logo placement | Top of sidebar |
| User button placement | Bottom of sidebar |
| Animation | None |
| Mobile behavior | Out of scope for this iteration |

## Nav items & icons

| Route | Icon (Lucide) |
| --- | --- |
| `/dashboard` | `LayoutDashboard` |
| `/transactions` | `Receipt` |
| `/budgets` | `Wallet` |
| `/categories` | `Tags` |

## Architecture

Purely presentation-layer work in the `(app)` route group.

- The `(app)/layout.tsx` stays a Server Component.
- A new client component `AppSidebar` handles active-route detection with
  `usePathname` and renders tooltips.
- The main content area sits beside the sidebar.

## Files to create

| File | Purpose |
| --- | --- |
| `src/app/(app)/_components/app-sidebar.tsx` | Client sidebar: logo, nav links with tooltips, active state, user button |

## Files to modify

| File | Change |
| --- | --- |
| `src/app/(app)/layout.tsx` | Replace `<header>` with `<AppSidebar />`; adjust main layout wrapper |

## Implementation steps

1. **Add tooltip primitive (if missing)**
   - Use the shadcn/ui `Tooltip` component. Install only if it is not already
     available in `src/components/ui/`.

2. **Build `AppSidebar`**
   - Define a local `navItems` array with `href`, `label`, and `icon`.
   - Use `usePathname()` to determine the active route. A route is active when
     `pathname === href` (exact match).
   - Render a sticky `aside` with `w-16 h-screen shrink-0 border-r bg-background`.
   - Structure:
     - Top: Expenser logo/brand as a simple stylized icon or letter inside a
       `<Link href="/dashboard">`.
     - Middle: nav links, each wrapped in a `<Tooltip>`.
     - Bottom: `<UserButton />` from Clerk.
   - Nav link styling:
     - Default: `flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground`.
     - Active: add `bg-accent text-foreground border-l-2 border-primary` (or
       `border-l-foreground` depending on theme contrast).
   - Tooltip content shows the route label.

3. **Update `(app)/layout.tsx`**
   - Remove the existing `<header>` and its mobile nav.
   - Wrap `AppSidebar` and `<main>` in a horizontal flex container:
     ```tsx
     <div className="flex min-h-full">
       <AppSidebar />
       <main className="flex-1 px-4 py-6">{children}</main>
     </div>
     ```
   - Keep `await auth.protect()` so the group remains protected.

4. **Verify accessibility**
   - Each nav link must have an `aria-label` matching the route label.
   - Tooltip trigger should be the link itself or wrap the icon without blocking
     keyboard focus.

5. **Visual smoke test**
   - Load `/dashboard`, `/transactions`, `/budgets`, `/categories` and confirm the
     correct icon is highlighted.
   - Hover each icon and confirm the tooltip label appears.
   - Confirm the user button is reachable at the bottom.

## Mobile note

Mobile navigation is intentionally left unchanged for this iteration. The icon-only
sidebar will render on small screens as a narrow vertical strip, which is usable but
not ideal. A follow-up iteration should decide between a bottom tab bar or a
hamburger/collapsible sidebar for mobile.

## Future work / open iterations

- Design and implement mobile navigation (bottom tab bar or collapsible drawer).
- Consider a collapsible "expanded" state for the sidebar.
- Add keyboard shortcut hints in tooltips (e.g. "Dashboard ⌘1").
