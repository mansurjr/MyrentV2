import { useState } from "react";
import { useOwners } from "../hooks/useOwners";
import type { ICreateOwnerDto } from "../hooks/useOwners";
import type { Owner } from "../../../types/api-responses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Save,
  Loader2,
  X,
  User,
  Phone,
  Hash,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AxiosError } from "axios";

interface OwnerFormProps {
  owner?: Owner | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function OwnerForm({ owner, onSuccess, onCancel }: OwnerFormProps) {
  const { t } = useTranslation();
  const isEdit = !!owner;
  const { createOwner, updateOwner } = useOwners();
  const [apiStatus, setApiStatus] = useState<number | null>(null);

  const [formData, setFormData] = useState<ICreateOwnerDto>(() => {
    return {
      fullName: owner?.fullName || "",
      address: owner?.address || "",
      tin: owner?.tin || "",
      phoneNumber: owner?.phoneNumber || "",
    };
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ICreateOwnerDto, string>>
  >({});

  const validate = () => {
    const newErrors: Partial<Record<keyof ICreateOwnerDto, string>> = {};
    if (!formData.fullName.trim())
      newErrors.fullName = "F.I.O kiritilishi shart";
    if (!formData.tin.trim()) {
      newErrors.tin = "STIR kiritilishi shart";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ICreateOwnerDto]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setApiStatus(null);

    try {
      if (isEdit && owner) {
        await updateOwner.mutateAsync({ id: owner.id, dto: formData });
        setApiStatus(200);
      } else {
        await createOwner.mutateAsync(formData);
        setApiStatus(201);
      }

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      setApiStatus(status || 500);
      console.error("Error saving owner:", error);
    }
  };

  const isSubmitting = createOwner.isPending || updateOwner.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-6 px-1 py-2">
        {apiStatus === 201 && (
          <Alert
            variant="default"
            className="bg-emerald-50 border-emerald-200 text-emerald-800 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertTitle>{t("common.success")}</AlertTitle>
            <AlertDescription>
              {t("common.created_successfully")}
            </AlertDescription>
          </Alert>
        )}

        {apiStatus === 409 && (
          <Alert
            variant="destructive"
            className="animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("common.error")}</AlertTitle>
            <AlertDescription>{t("common.already_exists")}</AlertDescription>
          </Alert>
        )}

        {apiStatus && apiStatus >= 500 && (
          <Alert
            variant="destructive"
            className="animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("common.error")}</AlertTitle>
            <AlertDescription>{t("common.error")}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-5">
          <div className="grid gap-2">
            <Label
              htmlFor="fullName"
              className={cn(
                "text-sm font-semibold flex items-center gap-1",
                errors.fullName ? "text-destructive" : "text-foreground",
              )}>
              F.I.O (To'liq ism){" "}
              <span className="text-destructive font-bold">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                name="fullName"
                placeholder="Masalan: Eshmatov Toshmat"
                value={formData.fullName}
                onChange={handleChange}
                className={cn(
                  "h-10 pl-10 transition-all focus:ring-primary/20",
                  errors.fullName &&
                    "border-destructive focus-visible:ring-destructive/20",
                )}
              />
            </div>
            {errors.fullName && (
              <p className="text-[12px] font-medium text-destructive mt-1 ml-1">
                {errors.fullName}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="tin"
              className={cn(
                "text-sm font-semibold flex items-center gap-1",
                errors.tin ? "text-destructive" : "text-foreground",
              )}>
              STIR (TIN) <span className="text-destructive font-bold">*</span>
            </Label>
            <div className="relative">
              <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="tin"
                name="tin"
                placeholder="9 xonali son"
                value={formData.tin}
                onChange={handleChange}
                className={cn(
                  "h-10 pl-10 transition-all focus:ring-primary/20",
                  errors.tin &&
                    "border-destructive focus-visible:ring-destructive/20",
                )}
              />
            </div>
            {errors.tin && (
              <p className="text-[12px] font-medium text-destructive mt-1 ml-1">
                {errors.tin}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="phoneNumber"
              className="text-sm font-semibold flex items-center gap-1">
              Telefon raqami
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phoneNumber"
                name="phoneNumber"
                placeholder="+998 90 123 45 67"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="h-10 pl-10 transition-all focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label
              htmlFor="address"
              className="text-sm font-semibold flex items-center gap-1">
              Manzil
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="address"
                name="address"
                placeholder="Yashash yoki ish manzili"
                value={formData.address}
                onChange={handleChange}
                className="h-10 pl-10 transition-all focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-6 pb-2 border-t border-border/50 mt-4 bg-background z-10">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 h-11 border-border/50 hover:bg-muted transition-colors">
          <X className="mr-2 h-4 w-4" />
          Bekor qilish
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 h-11 shadow-sm active:scale-[0.98] transition-all">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary-foreground" />
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
