import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../../api";
import type { Store, StoreListResponse } from "../../../types/api-responses";

export interface ICreateStoreDto {
  storeNumber: string;
  area: number;
  sectionId?: number;
  description?: string;
}

export interface IUpdateStoreDto extends Partial<ICreateStoreDto> {}

export interface IStoreOptions {
  search?: string;
  page?: number;
  limit?: number;
  sectionId?: number;
  onlyFree?: boolean;
  withContracts?: boolean;
  asOf?: string;
}

export const useStores = () => {
  const queryClient = useQueryClient();

  const useGetStores = (options: IStoreOptions = {}) => {
    const mergedOptions = { page: 1, limit: 10, ...options };
    return useQuery({
      queryKey: ["stores", mergedOptions],
      queryFn: async () => {
        const response = await baseApi.get<StoreListResponse>("/stores", {
          params: mergedOptions,
        });
        return response.data;
      },
    });
  };

  const useGetStore = (id: number) =>
    useQuery({
      queryKey: ["stores", id],
      queryFn: async () => {
        const response = await baseApi.get<Store>(`/stores/${id}`);
        return response.data;
      },
      enabled: !!id,
    });

  const checkStoreNumber = async (storeNumber: string, excludeId?: number) => {
    const response = await baseApi.get(`/stores/check-number/${storeNumber}`, {
      params: excludeId ? { excludeId } : {}
    });
    return response.data;
  };

  const createStore = useMutation({
    mutationFn: async (dto: ICreateStoreDto) => {
      const response = await baseApi.post<Store>("/stores", dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });

  const updateStore = useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: IUpdateStoreDto }) => {
      const response = await baseApi.patch<Store>(`/stores/${id}`, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });

  const deleteStore = useMutation({
    mutationFn: async (id: number) => {
      const response = await baseApi.delete(`/stores/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });

  const terminateContract = useMutation({
    mutationFn: async (contractId: number) => {
      const response = await baseApi.put(`/contracts/${contractId}`, { isActive: false });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });

  return {
    useGetStores,
    useGetStore,
    checkStoreNumber,
    createStore,
    updateStore,
    deleteStore,
    terminateContract,
  };
};
