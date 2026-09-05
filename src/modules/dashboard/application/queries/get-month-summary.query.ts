import type { YearMonth } from "@/shared/kernel/year-month";
import type { DashboardReadModel, MonthSummaryDto } from "../dashboard.dto";

export interface GetMonthSummaryQuery {
  userId: string;
  readModel: DashboardReadModel;
}

export async function getMonthSummary(
  yearMonth: YearMonth,
  { userId, readModel }: GetMonthSummaryQuery,
): Promise<MonthSummaryDto> {
  return readModel.getMonthSummary(userId, yearMonth);
}
