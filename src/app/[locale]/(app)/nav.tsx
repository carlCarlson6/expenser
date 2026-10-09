"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cx } from "@/shared/ui/cx";

const ITEMS = [
  { href: "/", key: "dashboard" },
  { href: "/expenses", key: "expenses" },
  { href: "/categories", key: "categories" },
  { href: "/reports", key: "reports" },
  { href: "/settings", key: "settings" },
] as const;

export function Nav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      <span className="mr-3 shrink-0 text-base font-bold tracking-tight">
        {t("appName")}
      </span>
      {ITEMS.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cx(
              "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
            )}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
