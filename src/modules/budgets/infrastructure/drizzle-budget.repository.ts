import { and, asc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Money } from "@/shared/kernel/money";
import { Budget } from "@/modules/budgets/domain/budget";
import type { BudgetRepository } from "@/modules/budgets/domain/budget.repository";
import {
  budgets,
  type BudgetRow,
} from "@/modules/budgets/infrastructure/budgets.schema";

function toDomain(row: BudgetRow): Budget {
  return Budget.reconstitute({
    id: row.id,
    userId: row.userId,
    categoryId: row.categoryId,
    year: row.year,
    month: row.month,
    amount: Money.reconstitute(row.amountCents),
  });
}

export class DrizzleBudgetRepository implements BudgetRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async findById(id: string): Promise<Budget | null> {
    const [row] = await this.db
      .select()
      .from(budgets)
      .where(eq(budgets.id, id))
      .limit(1);
    return row ? toDomain(row) : null;
  }

  async findByUserIdAndYearMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<Budget[]> {
    const rows = await this.db
      .select()
      .from(budgets)
      .where(
        and(eq(budgets.userId, userId), eq(budgets.year, year), eq(budgets.month, month)),
      )
      .orderBy(asc(budgets.categoryId));
    return rows.map(toDomain);
  }

  async findByUserIdAndCategoryIdAndYearMonth(
    userId: string,
    categoryId: string,
    year: number,
    month: number,
  ): Promise<Budget | null> {
    const [row] = await this.db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.categoryId, categoryId),
          eq(budgets.year, year),
          eq(budgets.month, month),
        ),
      )
      .limit(1);
    return row ? toDomain(row) : null;
  }

  async save(budget: Budget): Promise<void> {
    await this.db
      .insert(budgets)
      .values({
        id: budget.id,
        userId: budget.userId,
        categoryId: budget.categoryId,
        year: budget.year,
        month: budget.month,
        amountCents: budget.amount.cents,
      })
      .onConflictDoUpdate({
        target: budgets.id,
        set: {
          amountCents: budget.amount.cents,
          updatedAt: new Date(),
        },
      });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(budgets).where(eq(budgets.id, id));
  }
}
