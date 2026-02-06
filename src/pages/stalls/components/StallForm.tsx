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
import { useStalls, type ICreateStallDto } from "../hooks/useStalls";
import { useSaleTypes } from "../../sale-types/hooks/useSaleTypes";
import { useSections } from "../../sections/hooks/useSections";
import { useDebounce } from "@/hooks/useDebounce";
import type { Stall, SaleType } from "../../../types/api-responses";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StallFormProps {
  editData?: Stall | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StallForm({ editData, onSuccess, onCancel }: StallFormProps) {
  const { createStall, updateStall, checkStallNumber } = useStalls();
  const { useGetSaleTypes } = useSaleTypes();
  const { useGetSections } = useSections();

  const { data: saleTypesData } = useGetSaleTypes({ page: 1, limit: 100 });
  const { data: sectionsRaw } = useGetSections();

  const sections = Array.isArray(sectionsRaw)
    ? sectionsRaw
    : Array.isArray((sectionsRaw as any)?.data)
      ? (sectionsRaw as any).data
      : [];

  const saleTypes: SaleType[] = Array.isArray(saleTypesData)
    ? saleTypesData
    : Array.isArray((saleTypesData as any)?.data)
      ? (saleTypesData as any).data
      : [];

  const [formData, setFormData] = useState<ICreateStallDto>({
    stallNumber: "",
    area: 0,
    saleTypeId: undefined,
    sectionId: undefined,
    description: "",
  });

  const [totalSum, setTotalSum] = useState<number>(0);
  const [stallNumberError, setStallNumberError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const debouncedStallNumber = useDebounce(formData.stallNumber, 500);

  useEffect(() => {
    if (editData) {
      const raw = editData as any;
      const resolvedSaleTypeId =
        raw.SaleType?.id ||
        raw.saleType?.id ||
        raw.saleTypeId ||
        raw.sale_type_id;
      const resolvedSectionId =
        raw.Section?.id || raw.section?.id || raw.sectionId || raw.section_id;

      setFormData({
        stallNumber: editData.stallNumber || "",
        area: editData.area,
        saleTypeId: resolvedSaleTypeId ? Number(resolvedSaleTypeId) : undefined,
        sectionId: resolvedSectionId ? Number(resolvedSectionId) : undefined,
        description: editData.description || "",
      });
    } else {
      setFormData({
        stallNumber: "",
        area: 0,
        saleTypeId: undefined,
        sectionId: undefined,
        description: "",
      });
    }
  }, [editData]);

  useEffect(() => {
    const validateStallNumber = async () => {
      if (!debouncedStallNumber || debouncedStallNumber.trim() === "") {
        setStallNumberError(null);
        return;
      }


      if (editData && debouncedStallNumber === editData.stallNumber) {
        setStallNumberError(null);
        return;
      }

      setIsChecking(true);
      try {
        await checkStallNumber(debouncedStallNumber, editData?.id);
        setStallNumberError(null);
      } catch (error: any) {
        setStallNumberError(`${debouncedStallNumber} raqami band`);
      } finally {
        setIsChecking(false);
      }
    };

    validateStallNumber();
  }, [debouncedStallNumber, editData]);

  useEffect(() => {
    if (formData.area && formData.saleTypeId) {
      const selectedSaleType = saleTypes.find(
        (st) => st.id === formData.saleTypeId,
      );
      if (selectedSaleType) {
        setTotalSum(formData.area * selectedSaleType.tax);
      } else {
        setTotalSum(0);
      }
    } else {
      setTotalSum(0);
    }
  }, [formData.area, formData.saleTypeId, saleTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editData) {
        await updateStall.mutateAsync({ id: editData.id, dto: formData });
      } else {
        await createStall.mutateAsync(formData);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving stall:", error);
    }
  };

  const isPending = createStall.isPending || updateStall.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-6 px-1 py-2">
        <div className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="stallNumber" className="text-sm font-semibold">
              Rasta raqami
            </Label>
            <Input
              id="stallNumber"
              placeholder="Masalan: A-101"
              value={formData.stallNumber}
              onChange={(e) =>
                setFormData({ ...formData, stallNumber: e.target.value })
              }
              className={cn(
                "h-10 transition-all focus:ring-primary/20",
                stallNumberError ? "border-destructive focus-visible:ring-destructive/20" : ""
              )}
              required
            />
            {isChecking && <p className="text-[10px] text-muted-foreground animate-pulse">Tekshirilmoqda...</p>}
            {stallNumberError && (
              <div className="flex items-center gap-1 text-destructive mt-1">
                <AlertCircle className="h-3 w-3" />
                <p className="text-xs font-medium">{stallNumberError}</p>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="section" className="text-sm font-semibold">
              Bo'lim
            </Label>
            <Select
              value={
                formData.sectionId ? String(formData.sectionId) : String(editData?.sectionId)
              }
              onValueChange={(value) =>
                setFormData({ ...formData, sectionId: Number(value) })
              }>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Bo'limni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {sections.length > 0 ? (
                  sections.map((section: any) => (
                    <SelectItem key={section.id} value={String(section.id)}>
                      {section.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Bo'limlar mavjud emas
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="saleType" className="text-sm font-semibold">
              Sotuv turi
            </Label>
            <Select
              value={
                formData.saleTypeId ? String(formData.saleTypeId) : String(editData?.saleTypeId)
              }
              onValueChange={(value) =>
                setFormData({ ...formData, saleTypeId: Number(value) })
              }>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Sotuv turini tanlang" />
              </SelectTrigger>
              <SelectContent>
                {saleTypes.length > 0 ? (
                  saleTypes.map((st: any) => (
                    <SelectItem key={st.id} value={String(st.id)}>
                      {st.name} ({new Intl.NumberFormat("uz-UZ").format(st.tax)}{" "}
                      so'm)
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Sotuv turlari mavjud emas
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="area" className="text-sm font-semibold">
              Yuza (kv.m)
            </Label>
            <Input
              id="area"
              type="number"
              
              placeholder="0.00"
              value={formData.area || ""}
              onChange={(e) =>
                setFormData({ ...formData, area: Number(e.target.value) })
              }
              className="h-10 transition-all focus:ring-primary/20"
              required
            />
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

          <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm text-muted-foreground">
                Jami kunlik to'lov:
              </span>
              <span className="text-lg font-bold text-primary">
                {new Intl.NumberFormat("uz-UZ", {
                  style: "currency",
                  currency: "UZS",
                  maximumFractionDigits: 0,
                }).format(totalSum)}
              </span>
            </div>
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
          disabled={isPending || isChecking || !!stallNumberError}
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
