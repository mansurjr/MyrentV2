import { useState, useEffect } from "react";
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
import { useUsers, type ICreateUserDto } from "../hooks/useUsers";
import type { User } from "../../../types/api-responses";
import { Roles } from "../../../types/api-responses";

interface UserFormProps {
  editData?: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserForm({ editData, onSuccess, onCancel }: UserFormProps) {
  const { createUser, updateUser } = useUsers();
  const [formData, setFormData] = useState<ICreateUserDto>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: Roles.CHECKER,
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        email: editData.email || "",
        firstName: editData.firstName || "",
        lastName: editData.lastName || "",
        role: (editData.role as Roles) || Roles.CHECKER,
      });
    } else {
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: Roles.CHECKER,
      });
    }
  }, [editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editData) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        
        await updateUser.mutateAsync({ id: editData.id, dto: updateData });
      } else {
        await createUser.mutateAsync(formData);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const isPending = createUser.isPending || updateUser.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-6 px-1 py-2">
        <div className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="firstName" className="text-sm font-semibold">Ism</Label>
            <Input
              id="firstName"
              placeholder="Ism kiriting"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="h-10 transition-all focus:ring-primary/20"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lastName" className="text-sm font-semibold">Familiya</Label>
            <Input
              id="lastName"
              placeholder="Familiya kiriting"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="h-10 transition-all focus:ring-primary/20"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@domain.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-10 transition-all focus:ring-primary/20"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password" className="text-sm font-semibold">
              {editData ? "Parol (o'zgartirish uchun kiriting)" : "Parol"}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={editData ? "O'zgarishsiz qoldirish..." : "Parol kiriting"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="h-10 transition-all focus:ring-primary/20"
              required={!editData}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role" className="text-sm font-semibold">Rol</Label>
            <Select
              value={formData.role || editData?.role || Roles.CHECKER}
              onValueChange={(value) => setFormData({ ...formData, role: value as Roles })}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Rolni tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Roles.ADMIN}>Admin</SelectItem>
                <SelectItem value={Roles.CHECKER}>Tekshiruvchi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-6 pb-2 border-t border-border/50 mt-4 bg-background z-10">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          className="flex-1 h-11 border-border/50 hover:bg-muted transition-colors"
        >
          <X className="mr-2 h-4 w-4" />
          Bekor qilish
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="flex-1 h-11 shadow-sm active:scale-[0.98] transition-all"
        >
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
