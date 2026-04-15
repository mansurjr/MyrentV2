import baseApi from "./index";
import type { Attendance } from "@/types/api-responses";

export interface CreateAdminAttendanceRequest {
  date: string;
  stallId: string | number;
  status: "PAID" | "UNPAID";
  amount?: number;
}

export const createAdminAttendance = async (
  payload: CreateAdminAttendanceRequest,
) => {
  const response = await baseApi.post<Attendance>("/attendances", payload);
  return response.data;
};
