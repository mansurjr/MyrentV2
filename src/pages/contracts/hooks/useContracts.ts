import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../../api";
import type { Contract, ContractListResponse } from "../../../types/api-responses";

export interface ICreateContractDto {
  certificateNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  paymentType: 'ONLINE' | 'BANK_ONLY';
  shopMonthlyFee?: number;
  ownerId: number;
  storeId: number;
}

export interface IUpdateContractDto extends Partial<ICreateContractDto> {
  isActive?: boolean;
}

export interface IContractOptions {
  search?: string;
  page?: number;
  limit?: number;
  ownerId?: number;
  storeId?: number;
  isActive?: boolean;
  paid?: boolean;
  paymentType?: 'ONLINE' | 'BANK_ONLY';
}

export const useContracts = () => {
  const queryClient = useQueryClient();

  const useGetContracts = (options: IContractOptions = {}) => {
    const mergedOptions = { page: 1, limit: 10, ...options };
    return useQuery({
      queryKey: ["contracts", mergedOptions],
      queryFn: async () => {
        const response = await baseApi.get<ContractListResponse>("/contracts", {
          params: mergedOptions,
        });
        return response.data;
      },
    });
  };

  const useGetContract = (id: number) =>
    useQuery({
      queryKey: ["contracts", id],
      queryFn: async () => {
        const response = await baseApi.get<Contract>(`/contracts/${id}`);
        return response.data;
      },
      enabled: !!id,
    });

  const createContract = useMutation({
    mutationFn: async (dto: ICreateContractDto) => {
      const response = await baseApi.post<Contract>("/contracts", dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });

  const updateContract = useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: IUpdateContractDto }) => {
      const response = await baseApi.put<Contract>(`/contracts/${id}`, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });

  const deleteContract = useMutation({
    mutationFn: async (id: number) => {
      const response = await baseApi.delete(`/contracts/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });

  return {
    useGetContracts,
    useGetContract,
    createContract,
    updateContract,
    deleteContract,
  };
};
