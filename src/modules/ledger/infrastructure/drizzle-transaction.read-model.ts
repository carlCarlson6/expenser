import { and, between, desc, eq, count } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { YearMonth } from "@/shared/kernel/year-month";
import { categories } from "@/modules/categories/infrastructure/categories.schema";
import {
  transactions,
  type TransactionRow,
} from "@/modules/ledger/infrastructure/transactions.schema";
import type {
  TransactionListItemDto,
  TransactionReadModel,
} from "@/modules/ledger/application/transaction.dto";

type ReadRow = {
  transactions: TransactionRow;
  categories: {
    id: string;
    userId: string;
    name: string;
    color: string;
    icon: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

export class DrizzleTransactionReadModel implements TransactionReadModel {
  constructor(private readonly db: NodePgDatabase) {}

  async findByMonth(
    userId: string,
    yearMonth: YearMonth,
  ): Promise<TransactionListItemDto[]> {
    const range = yearMonth.toDateRange();
    const rows: ReadRow[] = await this.db
      .select()
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          between(transactions.date, range.start, range.end),
        ),
      )
      .orderBy(desc(transactions.date));

    return rows.map((row) => {
      const category = row.categories;
      return {
        id: row.transactions.id,
        userId: row.transactions.userId,
        type: row.transactions.type,
        amountCents: row.transactions.amountCents,
        date: row.transactions.date,
        categoryId: row.transactions.categoryId ?? null,
        note: row.transactions.note ?? "",
        category: category
          ? {
              id: category.id,
              name: category.name,
              color: category.color,
              icon: category.icon,
            }
          : null,
      };
    });
  }

  async countByCategoryId(categoryId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: count() })
      .from(transactions)
      .where(eq(transactions.categoryId, categoryId));
    return Number(row?.count ?? 0);
  }
}
