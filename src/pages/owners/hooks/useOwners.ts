import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../../api";
import type { Owner, OwnerListResponse } from "../../../types/api-responses";

export interface ICreator {
  firstName: string;
  lastName: string;
}

export interface IStore {
  id: number;
  storeNumber: string;
  area: number;
  sectionId: number | null;
}

export interface IContractResponse {
  id: number;
  certificateNumber: string;
  expiryDate: string;
  isActive: boolean;
  shopMonthlyFee: number;
  createdBy: ICreator;
  store: IStore;
}

export interface ICreateOwnerDto {
  fullName: string;
  address: string;
  tin: string;
  phoneNumber: string;
}

export interface IUpdateOwnerDto extends Partial<ICreateOwnerDto> {
  isActive?: boolean;
}

export interface IOwnerOptions {
  search?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export const useOwners = () => {
  const queryClient = useQueryClient();

  const useGetOwners = (options: IOwnerOptions = {}) => {
    const mergedOptions = { page: 1, limit: 10, ...options };
    return useQuery({
      queryKey: ["owners", mergedOptions],
      queryFn: async () => {
        const response = await baseApi.get<OwnerListResponse>("/owners", {
          params: mergedOptions,
        });
        return response.data;
      },
    });
  };

  const useGetOwner = (id: number) =>
    useQuery({
      queryKey: ["owners", id],
      queryFn: async () => {
        const response = await baseApi.get<Owner>(`/owners/${id}`);
        return response.data;
      },
      enabled: !!id,
    });

  const createOwner = useMutation({
    mutationFn: async (dto: ICreateOwnerDto) => {
      const response = await baseApi.post<Owner>("/owners", dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
    },
  });

  const updateOwner = useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: IUpdateOwnerDto }) => {
      const response = await baseApi.patch<Owner>(`/owners/${id}`, dto);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
      queryClient.invalidateQueries({ queryKey: ["owner", variables.id] });
    },
  });

  const deleteOwner = useMutation({
    mutationFn: async (id: number) => {
      const response = await baseApi.delete(`/owners/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
    },
  });

  return {
    useGetOwners,
    useGetOwner,
    createOwner,
    updateOwner,
    deleteOwner,
  };
};