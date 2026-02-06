import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Loader2, X } from "lucide-react";
import { useSections, type ICreateSectionDto } from "../hooks/useSections";
import { useUsers } from "../../users/hooks/useUsers";
import type { Section } from "../../../types/api-responses";
import { Roles } from "../../../types/api-responses";

interface SectionFormProps {
  editData?: Section | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SectionForm({
  editData,
  onSuccess,
  onCancel,
}: SectionFormProps) {
  const { createSection, updateSection } = useSections();
  const { useGetUsers } = useUsers();

  const { data: usersData, isLoading: usersLoading } = useGetUsers({
    page: 1,
    limit: 100,
  });

  const fetchedCheckers = useMemo(() => {
    return usersData?.data?.filter((user) => user.role === Roles.CHECKER) || [];
  }, [usersData]);


  const checkers = useMemo(() => {
    const list = [...fetchedCheckers];


    const currentId =
      editData?.assignedCheckerId || (editData?.assignedChecker as any)?.id;
    const currentChecker = editData?.assignedChecker;

    if (currentId && currentId !== 0) {
      const exists = list.some((c) => Number(c.id) === Number(currentId));
      if (!exists && currentChecker) {
        list.push({
          id: Number(currentId),
          firstName: (currentChecker as any).firstName || "",
          lastName: (currentChecker as any).lastName || "",
          role: Roles.CHECKER,
        } as any);
      }
    }
    return list;
  }, [fetchedCheckers, editData]);

  const [formData, setFormData] = useState<ICreateSectionDto>({
    name: "",
    description: "",
    assigneeId: 0,
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || "",
        description: editData.description || "",
        assigneeId: editData.assignedCheckerId || 0,
      });
    }
  }, [editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.assigneeId === 0) {
      return;
    }

    try {
      if (editData) {
        await updateSection.mutateAsync({ id: editData.id, dto: formData });
      } else {
        await createSection.mutateAsync(formData);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving section:", error);
    }
  };

  const isPending = createSection.isPending || updateSection.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-6 px-1 py-2">
        <div className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-semibold">
              Bo'lim nomi
            </Label>
            <Input
              id="name"
              placeholder="Masalan: Oziq-ovqat"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="h-10 transition-all focus:ring-primary/20"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="assignee" className="text-sm font-semibold">
              Biriktirilgan tekshiruvchi
            </Label>
            <Select
              value={
                formData.assigneeId ? String(formData.assigneeId) : String(editData?.assignedCheckerId)
              }
              onValueChange={(value) =>
                setFormData({ ...formData, assigneeId: Number(value) })
              }>
              <SelectTrigger className="h-10 w-full">
                <SelectValue
                  placeholder={
                    usersLoading ? "Yuklanmoqda..." : "Tekshiruvchini tanlang"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {checkers.length > 0 ? (
                  checkers.map((user: any) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Tekshiruvchilar topilmadi
                  </div>
                )}
              </SelectContent>
            </Select>
            {!formData.assigneeId && !usersLoading && (
              <p className="text-[0.8rem] text-destructive">
                Tekshiruvchini tanlash majburiy
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-sm font-semibold">
              Tavsif
            </Label>
            <Input
              id="description"
              placeholder="Qisqa tavsif..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="h-10 transition-all focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-6 pb-2 border-t border-border/50 mt-4 bg-background z-10">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          className="flex-1 h-11 border-border/50 hover:bg-muted transition-colors">
          <X className="mr-2 h-4 w-4" />
          Bekor qilish
        </Button>
        <Button
          type="submit"
          disabled={isPending || !formData.assigneeId}
          className="flex-1 h-11 shadow-sm active:scale-[0.98] transition-all">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saqlanmoqda...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Saqlash
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
