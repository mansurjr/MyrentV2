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

export interface IManualPayDto {
  months: number;
  startMonth?: string;
  transferDate: string;
  transferNumber: string;
}

export interface IPaymentUrlsDto {
  months?: number;
  startMonth?: string;
  method?: 'CLICK' | 'PAYME';
}

export interface IPaymentUrlsResponse {
  transactionReference: string;
  months: number;
  amount: number;
  startMonth: string;
  method: 'CLICK' | 'PAYME';
  url: string;
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

  const payContract = useMutation({
    mutationFn: async ({ id, amount, month }: { id: number; amount: number; month?: string }) => {
      const response = await baseApi.post(`/contracts/${id}/pay`, { amount, month });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const manualPayContract = useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: IManualPayDto }) => {
      const response = await baseApi.post(`/contracts/${id}/payments/manual`, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const getPaymentUrls = async (id: number, params?: IPaymentUrlsDto) => {
    const response = await baseApi.get<IPaymentUrlsResponse>(`/contracts/${id}/payment-urls`, {
      params,
    });
    return response.data;
  };

  const automatePaymentRedirect = async (id: number, params?: IPaymentUrlsDto) => {
    try {
      const isMyRent = window.location.hostname.includes("myrent.uz");
      const method = isMyRent ? 'PAYME' : 'CLICK';
      
      const response = await getPaymentUrls(id, { ...params, method });
      if (response?.url) {
        window.location.assign(response.url);
      }
    } catch (error) {
      console.error("Payment redirection failed:", error);
      throw error;
    }
  };

  return {
    useGetContracts,
    useGetContract,
    createContract,
    updateContract,
    deleteContract,
    payContract,
    manualPayContract,
    getPaymentUrls,
    automatePaymentRedirect,
  };
};
