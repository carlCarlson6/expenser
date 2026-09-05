import type { YearMonth } from "@/shared/kernel/year-month";
import type {
  TransactionListItemDto,
  TransactionReadModel,
} from "../transaction.dto";

export interface ListTransactionsForMonthQuery {
  userId: string;
  yearMonth: YearMonth;
  readModel: TransactionReadModel;
}

export async function listTransactionsForMonth({
  userId,
  yearMonth,
  readModel,
}: ListTransactionsForMonthQuery): Promise<TransactionListItemDto[]> {
  return readModel.findByMonth(userId, yearMonth);
}
