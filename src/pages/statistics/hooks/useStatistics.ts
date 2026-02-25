import baseApi from "@/api";
import { useQuery } from "@tanstack/react-query";


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

  return {
    getMonthlySeries,
    getRevenueByEntity,
  };
};
