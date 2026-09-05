import type { YearMonth } from "@/shared/kernel/year-month";
import type { DashboardReadModel, MonthlyTrendPointDto } from "../dashboard.dto";

export interface GetMonthlyTrendQuery {
  userId: string;
  months: YearMonth[];
  readModel: DashboardReadModel;
}

export async function getMonthlyTrend({
  userId,
  months,
  readModel,
}: GetMonthlyTrendQuery): Promise<MonthlyTrendPointDto[]> {
  return readModel.getMonthlyTrend(userId, months);
}
