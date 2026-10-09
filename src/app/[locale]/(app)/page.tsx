import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { listCategories } from "@/modules/categories/domain/queries/list-categories";
import {
  dashboardFiltersSchema,
  getDashboardData,
  presetRange,
} from "@/modules/reports/domain/queries/get-dashboard-data";
import { DashboardFilters } from "@/modules/reports/ui/dashboard-filters";
import { bucketLabel } from "@/modules/reports/ui/labels";
import { ShareBar } from "@/modules/reports/ui/share-bar";
import { TrendChart } from "@/modules/reports/ui/trend-chart";
import { getActor } from "@/modules/users/actor";
import { getDb } from "@/shared/db/client";
import { createRepos } from "@/shared/db/repos";
import { formatDate } from "@/shared/money/date";
import { formatCents } from "@/shared/money/money";

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const raw = await searchParams;
  const t = await getTranslations("dashboard");
  const actor = await getActor();
  const repos = createRepos(getDb());
  const today = new Date();

  const str = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : undefined;

  const preset = str(raw.preset);
  const presetDates = presetRange(
    preset === "30d" || preset === "6m" || preset === "12m" || preset === "month"
      ? preset
      : "6m",
    today,
  );

  const filters = dashboardFiltersSchema.parse({
    from: str(raw.from) ?? presetDates.from,
    to: str(raw.to) ?? presetDates.to,
    granularity: str(raw.granularity),
    categoryId: str(raw.categoryId),
  });

  const [data, categories] = await Promise.all([
    getDashboardData(repos, actor, filters, today),
    listCategories(repos, actor),
  ]);

  const fmt = (cents: number) => formatCents(cents, actor.currency, locale);
  const card = "rounded-xl border border-zinc-200 bg-white p-5";

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <DashboardFilters
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          preset: data.preset,
          from: data.from,
          to: data.to,
          granularity: data.granularity,
          categoryId: data.categoryId ?? "",
        }}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className={card}>
          <h2 className="mb-2 text-sm font-medium text-zinc-500">
            {t("total")}
          </h2>
          <p className="text-2xl font-semibold">{fmt(data.totalCents)}</p>
        </div>
        <div className={card}>
          <h2 className="mb-2 text-sm font-medium text-zinc-500">
            {t("previousPeriod")}
          </h2>
          <p className="text-2xl font-semibold">
            {fmt(data.previousTotalCents)}
          </p>
          {data.change !== null && (
            <p
              className={`mt-1 text-xs ${data.change > 0 ? "text-red-600" : "text-green-600"}`}
            >
              {t("vsPrevious", {
                value: `${data.change > 0 ? "+" : ""}${Math.round(data.change * 100)}%`,
              })}
            </p>
          )}
        </div>
        <div className={card}>
          <h2 className="mb-2 text-sm font-medium text-zinc-500">
            {t("expenseCount")}
          </h2>
          <p className="text-2xl font-semibold">{data.count}</p>
        </div>
        <div className={card}>
          <h2 className="mb-2 text-sm font-medium text-zinc-500">
            {t("dailyAvg")}
          </h2>
          <p className="text-2xl font-semibold">{fmt(data.dailyAvg)}</p>
        </div>
      </div>

      <div className={card}>
        <h2 className="mb-3 text-sm font-medium text-zinc-500">
          {t("overTime")}
        </h2>
        {data.buckets.length === 0 || data.totalCents === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">
            {t("noData")}
          </p>
        ) : (
          <TrendChart
            data={data.buckets.map((b) => ({
              label: bucketLabel(b.bucket, data.granularity, locale),
              value: b.totalCents / 100,
            }))}
            currency={actor.currency}
            locale={locale}
          />
        )}
      </div>

      <div className={card}>
        <h2 className="mb-3 text-sm font-medium text-zinc-500">
          {t("byCategory")}
        </h2>
        {data.byCategory.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">
            {t("noData")}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="pb-2 pr-2 font-medium">{t("category")}</th>
                <th className="pb-2 pr-2 text-right font-medium">
                  {t("total")}
                </th>
                <th className="pb-2 w-2/5 font-medium">{t("share")}</th>
              </tr>
            </thead>
            <tbody>
              {data.byCategory.map((c) => (
                <tr
                  key={c.categoryId}
                  className="border-b border-zinc-100 last:border-0"
                >
                  <td className="py-2 pr-2 text-zinc-700">{c.name}</td>
                  <td className="py-2 pr-2 text-right font-medium whitespace-nowrap">
                    {fmt(c.totalCents)}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <ShareBar share={c.share} />
                      <span className="w-10 text-right text-xs text-zinc-500">
                        {Math.round(c.share * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={card}>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">
          {t("recentExpenses")}
        </h2>
        {data.recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">
            {t("noExpenses")}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {data.recent.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500">
                    {formatDate(e.spentAt, locale)}
                  </span>
                  <span className="text-zinc-900">{e.description || "—"}</span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                    {e.categoryName}
                  </span>
                </div>
                <span className="font-medium whitespace-nowrap">
                  {fmt(e.amountCents)}
                </span>
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
      </div>
    </section>
  );
}
