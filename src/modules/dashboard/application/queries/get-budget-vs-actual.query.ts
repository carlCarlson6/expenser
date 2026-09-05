import type { YearMonth } from "@/shared/kernel/year-month";
import type { BudgetVsActualItemDto, DashboardReadModel } from "../dashboard.dto";

export interface GetBudgetVsActualQuery {
  userId: string;
  readModel: DashboardReadModel;
}

export async function getBudgetVsActual(
  yearMonth: YearMonth,
  { userId, readModel }: GetBudgetVsActualQuery,
): Promise<BudgetVsActualItemDto[]> {
  return readModel.getBudgetVsActual(userId, yearMonth);
}
