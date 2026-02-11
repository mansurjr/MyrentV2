import baseApi from "@/api";
import { useQuery } from "@tanstack/react-query";

interface StatisticsParams {
  from?: string;
  to?: string;
  month?: number;
  year?: number;
  months?: number;
  type?: "stall" | "store" | "all";
  groupBy?: "daily" | "weekly" | "monthly";
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

  const getTotals = (params: StatisticsParams) => {
    return useQuery({
      queryKey: ["statistics", "totals", params],
      queryFn: async () => {
        const { data } = await baseApi.get("/statistics/totals", { params });
        return data;
      },
    });
  };

  return {
    getMonthlySeries,
    getRevenueByEntity,
    getTotals,
  };
};
