import baseApi from "./index";
import type { PaymentUrlResponse } from "@/types/payment";

export const createAdminContractPaymentUrl = async (
  contractId: number,
  payload: { periodIds: string[] },
) => {
  const response = await baseApi.post<PaymentUrlResponse>(
    `/contracts/${contractId}/payment-url`,
    payload,
  );
  return response.data;
};

export const getAdminAttendancePaymentUrl = async (attendanceId: number) => {
  const response = await baseApi.get<PaymentUrlResponse>(`/attendances/${attendanceId}/pay`);
  return response.data;
};
