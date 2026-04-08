import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../../api";
import type { Contract, ContractListResponse } from "../../../types/api-responses";
import { createAdminContractPaymentUrl } from "@/api/payments";
import { getApiErrorStatus } from "@/lib/api-error";
import { normalizePeriodIds } from "@/lib/payment";
import type { PublicPaymentMethod } from "@/types/payment";

export interface ICreateContractDto {
  certificateNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  paymentType: 'ONLINE' | 'BANK';
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
  paymentType?: 'ONLINE' | 'BANK';
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

export interface IGenerateFuturePeriodsDto {
  months: number;
}

export interface IGenerateFuturePeriodsResponse {
  contractId: number;
  generatedPeriods: Array<{
    year: number;
    month: number;
  }>;
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
      queryClient.invalidateQueries({ queryKey: ["statistics", "reconciliation-contracts"] });
    },
  });

  const updateContract = useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: IUpdateContractDto }) => {
      const response = await baseApi.patch<Contract>(`/contracts/${id}`, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["statistics", "reconciliation-contracts"] });
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
      queryClient.invalidateQueries({ queryKey: ["statistics", "reconciliation-contracts"] });
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
      queryClient.invalidateQueries({ queryKey: ["statistics", "reconciliation-contracts"] });
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
      queryClient.invalidateQueries({ queryKey: ["statistics", "reconciliation-contracts"] });
    },
  });

  const generateFuturePeriods = useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: IGenerateFuturePeriodsDto }) => {
      const response = await baseApi.post<IGenerateFuturePeriodsResponse>(
        `/contracts/${id}/future-periods`,
        dto,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["statistics", "reconciliation-contracts"] });
    },
  });

  const getPaymentUrl = async (
    id: number,
    periodIds: string[],
    method?: PublicPaymentMethod,
  ) => {
    return createAdminContractPaymentUrl(id, {
      periodIds: normalizePeriodIds(periodIds),
      method,
    });
  };

  const automatePaymentRedirect = async (
    id: number,
    periodIds: string[],
    method?: PublicPaymentMethod,
  ) => {
    try {
      const normalizedPeriodIds = normalizePeriodIds(periodIds);
      if (normalizedPeriodIds.length === 0) {
        throw new Error("No pending payment periods selected");
      }

      const response = await getPaymentUrl(id, normalizedPeriodIds, method);
      if (response?.url) {
        window.open(response.url, '_blank');
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (error) {
      const status = getApiErrorStatus(error);
      if (status === 400 || status === 409) {
        await queryClient.invalidateQueries({ queryKey: ["contracts"] });
      }
      console.error("Payment redirection failed:", error);
      throw error;
    }
  };

  const getPaymentUrls = async (id: number, dto: IPaymentUrlsDto) => {
    const response = await baseApi.post<IPaymentUrlsResponse>(`/contracts/${id}/payment-urls`, dto);
    return response.data;
  };

  const updatePeriod = useMutation({
    mutationFn: async ({ periodId, amount }: { periodId: string; amount: number }) => {
      const response = await baseApi.patch(`/contracts/periods/${periodId}`, { amount });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["statistics", "reconciliation-contracts"] });
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
    generateFuturePeriods,
    getPaymentUrl,
    getPaymentUrls,
    automatePaymentRedirect,
    updatePeriod,
  };
};
