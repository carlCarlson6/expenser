import { getTranslations } from "next-intl/server";

import { listCategoriesWithTotals } from "@/modules/categories/domain/queries/list-categories";
import { CategoryList } from "@/modules/categories/ui/category-list";
import { getActor } from "@/modules/users/actor";
import { getDb } from "@/shared/db/client";
import { createRepos } from "@/shared/db/repos";
import { formatCents } from "@/shared/money/money";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("categories");
  const actor = await getActor();

  const categories = await listCategoriesWithTotals(
    createRepos(getDb()),
    actor,
  );
  const protectedName =
    categories.find((c) => c.isProtected)?.name ?? "—";

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
      </div>
      <CategoryList
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          isProtected: c.isProtected,
          expenseCount: c.expenseCount,
          total: formatCents(c.totalCents, actor.currency, locale),
        }))}
        protectedName={protectedName}
      />
    </section>
  );
}
