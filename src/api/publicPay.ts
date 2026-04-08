import baseApi from "./index";
import type {
  PaymentUrlResponse,
  PublicContractDetail,
  PublicContractPaymentUrlRequest,
  PublicContractSearchResult,
  PublicStallDetail,
  PublicStallPaymentUrlRequest,
} from "@/types/payment";

export const searchPublicContracts = async (params: {
  storeNumber?: string;
  tin?: string;
  fields?: string;
}) => {
  const response = await baseApi.get<PublicContractSearchResult[]>("/public/contracts/search", {
    params,
  });
  return response.data;
};

export const getPublicStall = async (
  stallNumber: string,
  params: { date?: string; fields?: string },
) => {
  const response = await baseApi.get<PublicStallDetail>(`/public/stalls/${stallNumber}`, {
    params,
  });
  return response.data;
};

export const getPublicContractDetail = async (contractId: number) => {
  const response = await baseApi.get<PublicContractDetail>(`/public/contracts/${contractId}`);
  const normalizedPaymentPeriods =
    response.data.paymentPeriods ??
    response.data.pendingPeriods ??
    [];

  return {
    ...response.data,
    paymentPeriods: normalizedPaymentPeriods,
    pendingPeriods: response.data.pendingPeriods ?? normalizedPaymentPeriods,
  };
};

export const createPublicContractPaymentUrl = async (
  contractId: number,
  payload: PublicContractPaymentUrlRequest,
) => {
  const response = await baseApi.post<PaymentUrlResponse>(
    `/public/contracts/${contractId}/payment-url`,
    payload,
  );
  return response.data;
};

export const createPublicStallPaymentUrl = async (
  stallNumber: string,
  payload: PublicStallPaymentUrlRequest,
) => {
  const response = await baseApi.post<PaymentUrlResponse>(
    `/public/stalls/${stallNumber}/payment-url`,
    payload,
  );
  return response.data;
};
