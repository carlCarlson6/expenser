"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cx } from "@/shared/ui/cx";

const ITEMS = [
  { href: "/", key: "dashboard", color: "#6366f1" },
  { href: "/expenses", key: "expenses", color: "#0ea5e9" },
  { href: "/categories", key: "categories", color: "#ec4899" },
  { href: "/settings", key: "settings", color: "#64748b" },
] as const;

export function Nav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      <span className="mr-3 shrink-0 text-base font-bold tracking-tight">
        <span
          aria-hidden
          className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full bg-indigo-600 align-middle"
        />
        {t("appName")}
      </span>
      {ITEMS.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-zinc-100 text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
            )}
          >
            <span
              aria-hidden
              className={cx(
                "h-2 w-2 rounded-full transition-colors",
                active ? "" : "opacity-60",
              )}
              style={{ backgroundColor: item.color }}
            />
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
