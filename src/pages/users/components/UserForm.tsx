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
import { Save, Loader2, X, AlertCircle } from "lucide-react";
import { useUsers, type ICreateUserDto } from "../hooks/useUsers";
import type { User } from "../../../types/api-responses";
import { Roles } from "../../../types/api-responses";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  extractFieldErrors,
  getApiErrorMessage,
  normalizeApiError,
} from "@/lib/api-error";

interface UserFormProps {
  editData?: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserForm({ editData, onSuccess, onCancel }: UserFormProps) {
  const { t } = useTranslation();
  const { createUser, updateUser } = useUsers();
  const [formData, setFormData] = useState<ICreateUserDto>({
    email: "",
    password: "",
    fullName: "",
    role: Roles.CHECKER,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ICreateUserDto, string>>>({});

  useEffect(() => {
    if (editData) {
      setFormData({
        email: editData.email || "",
        fullName: editData.fullName || "",
        role: (editData.role as Roles) || Roles.CHECKER,
      });
    } else {
      setFormData({
        email: "",
        password: "",
        fullName: "",
        role: Roles.CHECKER,
      });
    }
  }, [editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

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
      const apiError = normalizeApiError(error);
      setSubmitError(getApiErrorMessage(error, t));

      if (apiError.code === "VALIDATION_ERROR") {
        const errors = extractFieldErrors(error);
        setFieldErrors({
          email: errors.email,
          password: errors.password,
          fullName: errors.fullName,
          role: errors.role,
        });
      }

      console.error("Error saving user:", error);
    }
  };

  const isPending = createUser.isPending || updateUser.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-6 px-1 py-2">
        {submitError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("common.error")}</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="fullName" className="text-sm font-semibold">To'liq ism</Label>
            <Input
              id="fullName"
              placeholder="To'liq ismni kiriting"
              value={formData.fullName}
              onChange={(e) => {
                setFormData({ ...formData, fullName: e.target.value });
                if (fieldErrors.fullName) {
                  setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                }
              }}
              className="h-10 transition-all focus:ring-primary/20"
            />
            {fieldErrors.fullName && (
              <p className="text-[12px] font-medium text-destructive mt-1 ml-1">
                {fieldErrors.fullName}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@domain.com"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              className="h-10 transition-all focus:ring-primary/20"
              required
            />
            {fieldErrors.email && (
              <p className="text-[12px] font-medium text-destructive mt-1 ml-1">
                {fieldErrors.email}
              </p>
            )}
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
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              className="h-10 transition-all focus:ring-primary/20"
              required={!editData}
            />
            {fieldErrors.password && (
              <p className="text-[12px] font-medium text-destructive mt-1 ml-1">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role" className="text-sm font-semibold">Rol</Label>
            <Select
              value={formData.role || editData?.role || Roles.CHECKER}
              onValueChange={(value) => {
                setFormData({ ...formData, role: value as Roles });
                if (fieldErrors.role) {
                  setFieldErrors((prev) => ({ ...prev, role: undefined }));
                }
              }}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Rolni tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Roles.ADMIN}>Admin</SelectItem>
                <SelectItem value={Roles.CHECKER}>Tekshiruvchi</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.role && (
              <p className="text-[12px] font-medium text-destructive mt-1 ml-1">
                {fieldErrors.role}
              </p>
            )}
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
