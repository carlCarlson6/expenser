import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getDashboardData } from "@/modules/reports/domain/queries/get-dashboard-data";
import { bucketLabel } from "@/modules/reports/ui/labels";
import { ShareBar } from "@/modules/reports/ui/share-bar";
import { TrendChart } from "@/modules/reports/ui/trend-chart";
import { getActor } from "@/modules/users/actor";
import { getDb } from "@/shared/db/client";
import { createRepos } from "@/shared/db/repos";
import { formatDate } from "@/shared/money/date";
import { formatCents } from "@/shared/money/money";

function Card({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-5 ${className ?? ""}`}
    >
      <h2 className="mb-3 text-sm font-medium text-zinc-500">{title}</h2>
      {children}
    </div>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("dashboard");
  const actor = await getActor();

  const data = await getDashboardData(createRepos(getDb()), actor, new Date());
  const fmt = (cents: number) => formatCents(cents, actor.currency, locale);

  const change =
    data.lastMonthTotal > 0
      ? (data.thisMonthTotal - data.lastMonthTotal) / data.lastMonthTotal
      : null;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card title={t("thisMonth")}>
          <p className="text-2xl font-semibold">{fmt(data.thisMonthTotal)}</p>
        </Card>
        <Card title={t("lastMonth")}>
          <p className="text-2xl font-semibold">{fmt(data.lastMonthTotal)}</p>
          {change !== null && (
            <p
              className={`mt-1 text-xs ${change > 0 ? "text-red-600" : "text-green-600"}`}
            >
              {t("vsLastMonth", {
                value: `${change > 0 ? "+" : ""}${Math.round(change * 100)}%`,
              })}
            </p>
          )}
        </Card>
        <Card title={t("expenseCount")}>
          <p className="text-2xl font-semibold">{data.count}</p>
        </Card>
        <Card title={t("dailyAvg")}>
          <p className="text-2xl font-semibold">{fmt(data.dailyAvg)}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t("trend")}>
          <TrendChart
            data={data.trend.map((b) => ({
              label: bucketLabel(b.bucket, "month", locale),
              value: b.totalCents / 100,
            }))}
            currency={actor.currency}
            locale={locale}
          />
        </Card>

        <Card title={t("byCategory")}>
          {data.byCategory.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              {t("noExpenses")}
            </p>
          ) : (
            <ul className="space-y-3">
              {data.byCategory.slice(0, 6).map((c) => (
                <li key={c.categoryId}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-zinc-700">{c.name}</span>
                    <span className="font-medium">{fmt(c.totalCents)}</span>
                  </div>
                  <ShareBar share={c.share} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title={t("recentExpenses")}>
        {data.recent.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">
            {t("noExpenses")}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {data.recent.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500">
                    {formatDate(e.spentAt, locale)}
                  </span>
                  <span className="text-zinc-900">{e.description || "—"}</span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                    {e.categoryName}
                  </span>
                </div>
                <span className="font-medium">{fmt(e.amountCents)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 text-right">
          <Link
            href="/expenses"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            {t("viewAll")} →
          </Link>
        </div>
      </Card>
    </section>
  );
}
