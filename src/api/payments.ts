import baseApi from "./index";
import type { PaymentUrlResponse, PublicPaymentMethod } from "@/types/payment";

export const createAdminContractPaymentUrl = async (
  contractId: number,
  payload: { periodIds: string[]; method?: PublicPaymentMethod },
) => {
  const response = await baseApi.post<PaymentUrlResponse>(
    `/contracts/${contractId}/payment-url`,
    payload,
  );
  return response.data;
};

export const getAdminAttendancePaymentUrl = async (
  attendanceId: number,
  method?: PublicPaymentMethod,
) => {
  const response = await baseApi.get<PaymentUrlResponse>(`/attendances/${attendanceId}/pay`, {
    params: method ? { method } : undefined,
  });
  return response.data;
};
