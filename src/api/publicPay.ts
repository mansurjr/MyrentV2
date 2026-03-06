import baseApi from "./index";

export const searchPublicContracts = async (params: { storeNumber?: string; tin?: string; fields?: string }) => {
  const response = await baseApi.get("/public/contracts/search", { params });
  return response.data;
};

export const getPublicStall = async (stallNumber: string, params: { date?: string; fields?: string }) => {
  const response = await baseApi.get(`/public/stalls/${stallNumber}`, { params });
  return response.data;
};

export const getPublicContractDetail = async (contractId: number) => {
  const response = await baseApi.get(`/public/contracts/${contractId}`);
  return response.data;
};

export const createPublicContractPaymentUrl = async (
  contractId: number,
  payload: { periodIds: Array<string | number>; method: string },
) => {
  const response = await baseApi.post(`/public/contracts/${contractId}/payment-url`, payload);
  return response.data;
};

export const createPublicStallPaymentUrl = async (
  stallNumber: string,
  payload: { date?: string; method: string },
) => {
  const response = await baseApi.post(`/public/stalls/${stallNumber}/payment-url`, payload);
  return response.data;
};
