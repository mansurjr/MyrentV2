import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../../api";
import type { Attendance, AttendanceListResponse } from "../../../types/api-responses";

export interface IAttendanceOptions {
  dateFrom?: string;
  dateTo?: string;
  stallId?: number;
  page?: number;
  limit?: number;
}

export interface ICreateAttendanceDto {
  date: string;
  stallId: number;
  status: 'PAID' | 'UNPAID';
  amount?: number;
}

export const useAttendances = () => {
  const queryClient = useQueryClient();

  const useGetAttendances = (options: IAttendanceOptions) =>
    useQuery({
      queryKey: ["attendances", options],
      queryFn: async () => {
        const response = await baseApi.get<AttendanceListResponse>("/attendances", {
          params: options,
        });
        return response.data;
      },
    });

  const createAttendance = useMutation({
    mutationFn: async (dto: ICreateAttendanceDto) => {
      const response = await baseApi.post<Attendance>("/attendances", dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
    },
  });

  const updateAttendance = useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: Partial<ICreateAttendanceDto> }) => {
      const response = await baseApi.patch<Attendance>(`/attendances/${id}`, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
    },
  });

  return {
    useGetAttendances,
    createAttendance,
    updateAttendance,
  };
};
