import baseApi from "@/api";
import { useQuery } from "@tanstack/react-query";

export interface IReconciliationContractsParams {
  ownerId?: number;
  storeId?: string;
  contractId?: number;
  isActive?: boolean;
  paymentType?: "ONLINE" | "BANK";
  search?: string;
  page?: number;
  limit?: number;
}

export interface IReconciliationSummaryItem {
  id?: number;
  contractId?: number;
  unpaid?: number;
  debt?: number;
  debtAmount?: number;
  unpaidMonths?: number;
  debtMonths?: number;
  [key: string]: unknown;
}

export interface IReconciliationContractsResponse {
  totalDebt?: number;
  summary?: IReconciliationSummaryItem[];
  [key: string]: unknown;
}

export const useStatistics = () => {
  const getMonthlySeries = (params: { months?: number; type?: string }) => {
    return useQuery({
      queryKey: ["statistics", "monthly-series", params],
      queryFn: async () => {
        const { data } = await baseApi.get("/statistics/series/monthly", {
          params: {
            months: params.months || 12,
            type: params.type || "all",
          },
        });
        return data;
      },
    });
  };

  const getRevenueByEntity = (params: { month?: number; year?: number }) => {
    return useQuery({
      queryKey: ["statistics", "by-entity", params],
      queryFn: async () => {
        const { data } = await baseApi.get("/statistics/by-entity", {
          params,
        });
        return data;
      },
    });
  };

  const getReconciliationContracts = (
    params: IReconciliationContractsParams = {},
    options: { enabled?: boolean } = {},
  ) => {
    return useQuery({
      queryKey: ["statistics", "reconciliation-contracts", params],
      queryFn: async () => {
        const { data } = await baseApi.get<IReconciliationContractsResponse>(
          "/statistics/reconciliation/contracts",
          { params },
        );
        return data;
      },
      enabled: options.enabled ?? true,
    });
  };

  const getDashboardStats = () => {
    return useQuery({
      queryKey: ["statistics", "dashboard"],
      queryFn: async () => {
        const { data } = await baseApi.get("/statistics/dashboard");
        return data;
      },
    });
  };

  return {
    getMonthlySeries,
    getRevenueByEntity,
    getReconciliationContracts,
    getDashboardStats,
  };
};
