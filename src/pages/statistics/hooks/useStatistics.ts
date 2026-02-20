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
  const getMonthlySeries = (params: { months?: number; type?: "stall" | "store" | "all" }) => {
    const resolvedParams = {
      months: params.months || 12,
      type: params.type || "all",
    };

    return useQuery({
      queryKey: ["statistics", "monthly-series", resolvedParams],
      queryFn: async () => {
        const { data } = await baseApi.get("/statistics/series/monthly", {
          params: resolvedParams,
        });
        return data;
      },
    });
  };

  const getRevenueByEntity = (params: { month?: number; year?: number; type?: "stall" | "store" | "all" }) => {
    const resolvedParams = {
      ...params,
      type: params.type || "all",
    };

    return useQuery({
      queryKey: ["statistics", "by-entity", resolvedParams],
      queryFn: async () => {
        const { data } = await baseApi.get("/statistics/by-entity", {
          params: resolvedParams,
        });
        return data;
      },
    });
  };

  const getTotals = (params: StatisticsParams) => {
    const resolvedParams = {
      ...params,
      type: params.type || "all",
    };

    return useQuery({
      queryKey: ["statistics", "totals", resolvedParams],
      queryFn: async () => {
        const { data } = await baseApi.get("/statistics/totals", { params: resolvedParams });
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
