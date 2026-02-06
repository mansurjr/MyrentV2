import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../../api";
import type { Stall, StallListResponse } from "../../../types/api-responses";

export interface IStallOptions {
  search?: string;
  page?: number;
  limit?: number;
  sectionId?: number;
  saleTypeId?: number;
}

export interface ICreateStallDto {
  area: number;
  stallNumber: string;
  saleTypeId?: number;
  sectionId?: number;
  description?: string;
}

export interface IUpdateStallDto extends Partial<ICreateStallDto> {}

export const useStalls = () => {
  const queryClient = useQueryClient();

  const useGetStalls = (options: IStallOptions = { page: 1, limit: 10 }) =>
    useQuery({
      queryKey: ["stalls", options],
      queryFn: async () => {
        const response = await baseApi.get<StallListResponse>("/stalls", {
          params: options,
        });
        return response.data;
      },
    });

  const checkStallNumber = async (stallNumber: string, excludeId?: number) => {
    const response = await baseApi.get(`/stalls/check-number/${stallNumber}`, {
      params: { excludeId }
    });
    return response.data;
  };

  const createStall = useMutation({
    mutationFn: async (dto: ICreateStallDto) => {
      const response = await baseApi.post<Stall>("/stalls", dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stalls"] });
    },
  });

  const updateStall = useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: IUpdateStallDto }) => {
      const response = await baseApi.patch<Stall>(`/stalls/${id}`, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stalls"] });
    },
  });

  const deleteStall = useMutation({
    mutationFn: async (id: number) => {
      const response = await baseApi.delete(`/stalls/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stalls"] });
    },
  });

  return {
    useGetStalls,
    checkStallNumber,
    createStall,
    updateStall,
    deleteStall,
  };
};
