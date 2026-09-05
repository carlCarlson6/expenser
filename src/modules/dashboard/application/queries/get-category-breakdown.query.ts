import type { YearMonth } from "@/shared/kernel/year-month";
import type { CategoryBreakdownItemDto, DashboardReadModel } from "../dashboard.dto";

export interface GetCategoryBreakdownQuery {
  userId: string;
  readModel: DashboardReadModel;
}

export async function getCategoryBreakdown(
  yearMonth: YearMonth,
  { userId, readModel }: GetCategoryBreakdownQuery,
): Promise<CategoryBreakdownItemDto[]> {
  return readModel.getCategoryBreakdown(userId, yearMonth);
}
