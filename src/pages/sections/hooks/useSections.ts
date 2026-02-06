import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../../api";
import type { Section, SectionListResponse } from "../../../types/api-responses";

export interface ICreateSectionDto {
  name: string;
  description?: string;
  assigneeId: number;
}

export interface IUpdateSectionDto extends Partial<ICreateSectionDto> {}

export const useSections = () => {
  const queryClient = useQueryClient();

  const useGetSections = () =>
    useQuery({
      queryKey: ["sections"],
      queryFn: async () => {
        const response = await baseApi.get<SectionListResponse>("/sections");
        return response.data;
      },
    });

  const createSection = useMutation({
    mutationFn: async (dto: ICreateSectionDto) => {
      const response = await baseApi.post<Section>("/sections", dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
    },
  });

  const updateSection = useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: IUpdateSectionDto }) => {
      const response = await baseApi.patch<Section>(`/sections/${id}`, dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
    },
  });

  const deleteSection = useMutation({
    mutationFn: async (id: number) => {
      const response = await baseApi.delete(`/sections/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
    },
  });

  return {
    useGetSections,
    createSection,
    updateSection,
    deleteSection,
  };
};
