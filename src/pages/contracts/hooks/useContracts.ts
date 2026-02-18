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
  storeId: string;
}

export interface IUpdateContractDto extends Partial<ICreateContractDto> {
  isActive?: boolean;
}

export interface IContractOptions {
  search?: string;
  page?: number;
  limit?: number;
  ownerId?: number;
  storeId?: string;
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

  const getPaymentUrl = async (id: number, periodIds: string[]) => {
    const response = await baseApi.post<{ url: string }>(`/contracts/${id}/payment-url`, {
      periodIds,
    });
    return response.data;
  };

  const automatePaymentRedirect = async (id: number, periodIds: string[]) => {
    try {
      const response = await getPaymentUrl(id, periodIds);
      if (response?.url) {
        window.location.assign(response.url);
      } else {
        console.error("No payment URL returned");
      }
    } catch (error) {
      console.error("Payment redirection failed:", error);
      throw error;
    }
  };

  const updatePeriod = useMutation({
    mutationFn: async ({ periodId, amount }: { periodId: string; amount: number }) => {
      const response = await baseApi.patch(`/contracts/periods/${periodId}`, { amount });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });

  return {
    useGetContracts,
    useGetContract,
    createContract,
    updateContract,
    deleteContract,
    payContract,
    manualPayContract,
    getPaymentUrl,
    automatePaymentRedirect,
    updatePeriod,
  };
};
