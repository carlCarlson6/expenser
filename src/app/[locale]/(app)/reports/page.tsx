import { getTranslations } from "next-intl/server";

import { listCategories } from "@/modules/categories/domain/queries/list-categories";
import {
  defaultRange,
  getReportsData,
  reportsFiltersSchema,
} from "@/modules/reports/domain/queries/get-reports-data";
import { bucketLabel } from "@/modules/reports/ui/labels";
import { ReportsFilters } from "@/modules/reports/ui/reports-filters";
import { ShareBar } from "@/modules/reports/ui/share-bar";
import { TrendChart } from "@/modules/reports/ui/trend-chart";
import { getActor } from "@/modules/users/actor";
import { getDb } from "@/shared/db/client";
import { createRepos } from "@/shared/db/repos";
import { formatCents } from "@/shared/money/money";

export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const raw = await searchParams;
  const t = await getTranslations("reports");
  const actor = await getActor();
  const repos = createRepos(getDb());

  const str = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : undefined;
  const filters = reportsFiltersSchema.parse({
    from: str(raw.from),
    to: str(raw.to),
    granularity: str(raw.granularity),
    categoryId: str(raw.categoryId),
  });

  const [data, categories] = await Promise.all([
    getReportsData(repos, actor, filters, new Date()),
    listCategories(repos, actor),
  ]);

  const fmt = (cents: number) => formatCents(cents, actor.currency, locale);
  const fallback = defaultRange(new Date());

  return (
    <section>
      <h1 className="mb-6 text-2xl font-semibold">{t("title")}</h1>

      <ReportsFilters
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          from: filters.from ?? fallback.from,
          to: filters.to ?? fallback.to,
          granularity: filters.granularity,
          categoryId: filters.categoryId ?? "",
        }}
      />

      <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-medium text-zinc-500">{t("total")}</h2>
        <p className="text-3xl font-semibold">{fmt(data.totalCents)}</p>
      </div>

      {data.totalCents === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
          {t("noData")}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-medium text-zinc-500">
              {t("overTime")}
            </h2>
            <TrendChart
              data={data.buckets.map((b) => ({
                label: bucketLabel(b.bucket, data.granularity, locale),
                value: b.totalCents / 100,
              }))}
              currency={actor.currency}
              locale={locale}
            />
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-medium text-zinc-500">
              {t("byCategory")}
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500">
                  <th className="py-2 pr-2 font-medium">{t("category")}</th>
                  <th className="py-2 pr-2 text-right font-medium">
                    {t("total")}
                  </th>
                  <th className="w-2/5 py-2 font-medium">{t("share")}</th>
                </tr>
              </thead>
              <tbody>
                {data.byCategory.map((c) => (
                  <tr key={c.categoryId} className="border-b border-zinc-100 last:border-0">
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
          </div>
        </div>
      )}
    </section>
  );
}
