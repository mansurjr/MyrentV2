import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../../api";
import type { SaleType, SaleTypeListResponse } from "../../../types/api-responses";

export interface ISaleTypeOptions {
  search?: string;
  page?: number;
  limit?: number;
}

export interface ICreateSaleTypeDto {
  name: string;
  description: string;
  tax: number;
}

export const useSaleTypes = () => {
  const queryClient = useQueryClient();

  const useGetSaleTypes = (options: ISaleTypeOptions = { page: 1, limit: 10 }) =>
    useQuery({
      queryKey: ["sale-types", options],
      queryFn: async () => {
        const response = await baseApi.get<SaleTypeListResponse>("/sale-types", {
          params: options,
        });
        return response.data;
      },
    });

  const createSaleType = useMutation({
    mutationFn: async (dto: ICreateSaleTypeDto) => {
      const response = await baseApi.post<SaleType>("/sale-types", dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sale-types"] });
    },
  });

  const updateSaleType = useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: Partial<ICreateSaleTypeDto> }) => {
      const response = await baseApi.put<SaleType>(`/sale-types/${id}`, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sale-types"] });
    },
  });

  const deleteSaleType = useMutation({
    mutationFn: async (id: number) => {
      const response = await baseApi.delete(`/sale-types/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sale-types"] });
    },
  });

  return {
    useGetSaleTypes,
    createSaleType,
    updateSaleType,
    deleteSaleType,
  };
};
