import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { listCategories } from "@/modules/categories/domain/queries/list-categories";
import {
  dashboardFiltersSchema,
  getDashboardData,
} from "@/modules/reports/domain/queries/get-dashboard-data";
import {
  parsePreset,
  presetRange,
} from "@/modules/reports/domain/period";
import {
  CategoryBadge,
  CategoryDot,
  CategoryLegend,
} from "@/modules/reports/ui/category-legend";
import { CategoryDonut } from "@/modules/reports/ui/category-donut";
import {
  buildTrendSeries,
  movingAverageWindow,
  parseChartType,
  type ChartPoint,
  type TrendVariant,
} from "@/modules/reports/ui/chart";
import { DashboardFilters } from "@/modules/reports/ui/dashboard-filters";
import { CalendarHeatmap } from "@/modules/reports/ui/heatmap";
import { bucketLabel } from "@/modules/reports/ui/labels";
import { ShareBar } from "@/modules/reports/ui/share-bar";
import { StackedChart } from "@/modules/reports/ui/stacked-chart";
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

  const presetDates = presetRange(parsePreset(raw.preset), today);

  const filters = dashboardFiltersSchema.parse({
    from: str(raw.from) ?? presetDates.from,
    to: str(raw.to) ?? presetDates.to,
    granularity: str(raw.granularity),
    categoryId: str(raw.categoryId),
  });

  const chart = parseChartType(raw.chart);

  const [data, categories] = await Promise.all([
    getDashboardData(repos, actor, filters, today),
    listCategories(repos, actor),
  ]);

  const fmt = (cents: number) => formatCents(cents, actor.currency, locale);
  const card = "rounded-xl border border-zinc-200 bg-white p-5";
  // Bars wear the filtered category's color; without a filter they stay neutral.
  const activeCategory = categories.find((c) => c.id === data.categoryId);

  // Chart data is prepared here, on the server: the panel components stay
  // presentational and the transforms stay pure and unit-tested.
  const points: ChartPoint[] = data.buckets.map((b) => ({
    label: bucketLabel(b.bucket, data.granularity, locale),
    value: b.totalCents / 100,
  }));
  const baseline: ChartPoint[] = data.previousBuckets.map((b) => ({
    label: bucketLabel(b.bucket, data.granularity, locale),
    value: b.totalCents / 100,
  }));
  const trendVariant: TrendVariant =
    chart === "donut" || chart === "heatmap" ? "bar" : chart;
  const series = buildTrendSeries(
    points,
    baseline,
    trendVariant,
    movingAverageWindow(data.granularity),
  );

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <DashboardFilters
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          preset: data.preset,
          // Preset ranges are implicit: only an explicit custom range shows
          // its dates in the From/To fields.
          from: data.preset === "custom" ? data.from : "",
          to: data.preset === "custom" ? data.to : "",
          granularity: data.granularity,
          categoryId: data.categoryId ?? "",
          chart,
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
          {chart === "donut" || chart === "stacked"
            ? t("byCategory")
            : chart === "heatmap"
              ? t("calendar")
              : t("overTime")}
        </h2>
        {data.totalCents === 0 ||
        (chart === "donut" || chart === "stacked"
          ? data.byCategory.length === 0
          : data.buckets.length === 0) ? (
          <p className="py-12 text-center text-sm text-zinc-500">
            {t("noData")}
          </p>
        ) : chart === "donut" ? (
          <CategoryDonut
            items={data.byCategory.map((c) => ({
              name: c.name,
              color: c.color,
              totalCents: c.totalCents,
            }))}
            currency={actor.currency}
            locale={locale}
          />
        ) : chart === "stacked" ? (
          <StackedChart
            data={data.stacked.buckets.map((b) => ({
              label: bucketLabel(b.bucket, data.granularity, locale),
              // Recharts stacks whatever numeric keys the row carries.
              ...Object.fromEntries(
                Object.entries(b.byCategory).map(([k, v]) => [k, v / 100]),
              ),
            }))}
            categories={data.stacked.categories}
            otherName={t("otherCategories")}
            currency={actor.currency}
            locale={locale}
          />
        ) : chart === "heatmap" ? (
          <CalendarHeatmap
            days={data.daily}
            currency={actor.currency}
            locale={locale}
            labels={{
              weekdays: t.raw("weekdays").split(","),
              less: t("less"),
              more: t("more"),
            }}
          />
        ) : (
          <TrendChart
            variant={trendVariant}
            data={series}
            currency={actor.currency}
            locale={locale}
            color={activeCategory?.color}
          />
        )}
        {chart !== "heatmap" && (
          <CategoryLegend
            items={data.byCategory.slice(0, 8).map((c) => ({
              name: c.name,
              color: c.color,
              totalCents: c.totalCents,
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
                  <td className="py-2 pr-2 text-zinc-700">
                    <span className="inline-flex items-center gap-2">
                      <CategoryDot color={c.color} />
                      {c.name}
                    </span>
                  </td>
                  <td className="py-2 pr-2 text-right font-medium whitespace-nowrap">
                    {fmt(c.totalCents)}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <ShareBar share={c.share} color={c.color} />
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
                  <CategoryBadge
                    color={e.categoryColor}
                    name={e.categoryName}
                  />
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
