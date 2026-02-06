import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../../api";
import type { User, UserListResponse, Roles } from "../../../types/api-responses";

export interface IUserOptions {
  search?: string;
  page?: number;
  limit?: number;
}

export interface ICreateUserDto {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role: Roles;
  isActive?: boolean;
}

export interface IUpdateUserDto extends Partial<ICreateUserDto> {}

export const useUsers = () => {
  const queryClient = useQueryClient();

  const useGetUsers = (options: IUserOptions = { page: 1, limit: 10 }) =>
    useQuery({
      queryKey: ["users", options],
      queryFn: async () => {
        const response = await baseApi.get<UserListResponse>("/users", {
          params: options,
        });
        return response.data;
      },
    });

  const createUser = useMutation({
    mutationFn: async (dto: ICreateUserDto) => {
      const response = await baseApi.post<User>("/users", dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: IUpdateUserDto }) => {
      const response = await baseApi.put<User>(`/users/${id}`, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      const response = await baseApi.delete(`/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return {
    useGetUsers,
    createUser,
    updateUser,
    deleteUser,
  };
};
