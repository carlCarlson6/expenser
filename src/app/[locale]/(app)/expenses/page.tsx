import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { listCategories } from "@/modules/categories/domain/queries/list-categories";
import { listExpenses } from "@/modules/expenses/domain/queries/list-expenses";
import { expenseFiltersSchema } from "@/modules/expenses/domain/validators/expense";
import { ExpenseFiltersBar } from "@/modules/expenses/ui/expense-filters";
import { ExpenseTable } from "@/modules/expenses/ui/expense-table";
import { getActor } from "@/modules/users/actor";
import { getDb } from "@/shared/db/client";
import { createRepos } from "@/shared/db/repos";
import { centsToInput, formatCents } from "@/shared/money/money";
import { formatDate } from "@/shared/money/date";

export default async function ExpensesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const raw = await searchParams;
  const t = await getTranslations("expenses");
  const tCommon = await getTranslations("common");
  const actor = await getActor();
  const repos = createRepos(getDb());

  const filters = expenseFiltersSchema.parse({
    categoryId: typeof raw.categoryId === "string" ? raw.categoryId : undefined,
    from: typeof raw.from === "string" ? raw.from : undefined,
    to: typeof raw.to === "string" ? raw.to : undefined,
    search: typeof raw.search === "string" ? raw.search : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
  });

  const [page, categories] = await Promise.all([
    listExpenses(repos, actor, filters),
    listCategories(repos, actor),
  ]);

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  const pageHref = (page: number) => {
    const qs = new URLSearchParams();
    if (filters.categoryId) qs.set("categoryId", filters.categoryId);
    if (filters.from) qs.set("from", filters.from);
    if (filters.to) qs.set("to", filters.to);
    if (filters.search) qs.set("search", filters.search);
    if (page > 1) qs.set("page", String(page));
    const s = qs.toString();
    return `/expenses${s ? `?${s}` : ""}`;
  };

  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <span className="text-sm text-zinc-500">{page.totalCount}</span>
      </div>

      <ExpenseFiltersBar
        categories={categoryOptions}
        initial={{
          categoryId: filters.categoryId ?? "",
          from: filters.from ?? "",
          to: filters.to ?? "",
          search: filters.search ?? "",
        }}
      />

      <ExpenseTable
        categories={categoryOptions}
        emptyMessage={t("empty")}
        rows={page.items.map((e) => ({
          id: e.id,
          spentAt: formatDate(e.spentAt, locale),
          description: e.description ?? "",
          categoryName: e.categoryName,
          amount: formatCents(e.amountCents, actor.currency, locale),
          edit: {
            amount: centsToInput(e.amountCents),
            categoryId: e.categoryId,
            description: e.description ?? "",
            spentAt: e.spentAt,
          },
        }))}
      />

      {page.pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            {tCommon("pageOf", { page: page.page, total: page.pageCount })}
          </span>
          <div className="flex gap-2">
            {page.page > 1 && (
              <Link
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 hover:bg-zinc-100"
                href={pageHref(page.page - 1)}
              >
                {tCommon("previous")}
              </Link>
            )}
            {page.page < page.pageCount && (
              <Link
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 hover:bg-zinc-100"
                href={pageHref(page.page + 1)}
              >
                {tCommon("next")}
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
