import baseApi from "./index";
import type {
  AdminAttendanceBulkPaymentRequest,
  AdminAttendancePaymentResponse,
  AdminAttendanceSinglePaymentResponse,
  PaymentUrlResponse,
  PublicPaymentMethod,
} from "@/types/payment";

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

export const createAdminAttendanceBulkPaymentUrl = async (
  payload: AdminAttendanceBulkPaymentRequest,
) => {
  const response = await baseApi.post<AdminAttendancePaymentResponse>(
    "/attendances/pay",
    payload,
  );
  return response.data;
};

export const getAdminAttendancePaymentUrl = async (attendanceId: number | string) => {
  const response = await baseApi.get<AdminAttendanceSinglePaymentResponse>(
    `/attendances/${attendanceId}/pay`,
  );
  return response.data;
};
