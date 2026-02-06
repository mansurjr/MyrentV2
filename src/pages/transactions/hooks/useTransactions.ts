import { useQuery } from "@tanstack/react-query";
import baseApi from "../../../api";
import type { TransactionListResponse } from "../../../types/api-responses";

export interface ITransactionOptions {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  source?: 'contract' | 'attendance';
  contractId?: number;
  attendanceId?: number;
}

export const useTransactions = () => {
  const useGetTransactions = (options: ITransactionOptions = { page: 1, limit: 10 }) =>
    useQuery({
      queryKey: ["transactions", options],
      queryFn: async () => {
        const response = await baseApi.get<TransactionListResponse>("/transactions", {
          params: options,
        });
        return response.data;
      },
    });

  return {
    useGetTransactions,
  };
};
