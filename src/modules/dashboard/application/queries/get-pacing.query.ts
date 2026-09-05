import type { YearMonth } from "@/shared/kernel/year-month";
import type { DashboardReadModel, PacingDto } from "../dashboard.dto";

export interface GetPacingQuery {
  userId: string;
  yearMonth: YearMonth;
  today: Date;
  readModel: DashboardReadModel;
}

export async function getPacing({
  userId,
  yearMonth,
  today,
  readModel,
}: GetPacingQuery): Promise<PacingDto> {
  return readModel.getPacing(userId, yearMonth, today);
}
