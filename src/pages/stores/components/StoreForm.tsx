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
import { useStores, type ICreateStoreDto } from "../hooks/useStores";
import { useSections } from "../../sections/hooks/useSections";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import type { Store } from "../../../types/api-responses";

interface StoreFormProps {
  editData?: Store | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StoreForm({ editData, onSuccess, onCancel }: StoreFormProps) {
  const { createStore, updateStore, checkStoreNumber } = useStores();
  const { useGetSections } = useSections();
  
  const { data: sectionsRaw, isLoading: sectionsLoading } = useGetSections();
  const sections = Array.isArray(sectionsRaw) ? sectionsRaw : 
                  (Array.isArray((sectionsRaw as any)?.data) ? (sectionsRaw as any).data : []);

  const [formData, setFormData] = useState<ICreateStoreDto>({
    storeNumber: "",
    area: 0,
    sectionId: undefined,
    description: "",
  });

  const [storeNumberError, setStoreNumberError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const debouncedStoreNumber = useDebounce(formData.storeNumber, 500);

  useEffect(() => {
    if (editData) {
      setFormData({
        storeNumber: editData.storeNumber || "",
        area: editData.area || 0,
        sectionId: editData.sectionId || undefined,
        description: editData.description || "",
      });
    } else {
      setFormData({
        storeNumber: "",
        area: 0,
        sectionId: undefined,
        description: "",
      });
    }
  }, [editData]);

  useEffect(() => {
    const validateStoreNumber = async () => {
      if (!debouncedStoreNumber || debouncedStoreNumber.trim() === "") {
        setStoreNumberError(null);
        return;
      }

      if (editData && debouncedStoreNumber === editData.storeNumber) {
        setStoreNumberError(null);
        return;
      }

      setIsChecking(true);
      try {
        await checkStoreNumber(debouncedStoreNumber, editData?.id);
        setStoreNumberError(null);
      } catch (error: any) {
        setStoreNumberError(`${debouncedStoreNumber} raqami band`);
      } finally {
        setIsChecking(false);
      }
    };

    validateStoreNumber();
  }, [debouncedStoreNumber, editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editData) {
        await updateStore.mutateAsync({ id: editData.id, dto: formData });
      } else {
        await createStore.mutateAsync(formData);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving store:", error);
    }
  };

  const isPending = createStore.isPending || updateStore.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-6 px-1 py-2">
        <div className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="storeNumber" className="text-sm font-semibold">Do'kon raqami</Label>
            <Input
              id="storeNumber"
              placeholder="Masalan: B-101"
              value={formData.storeNumber}
              onChange={(e) => setFormData({ ...formData, storeNumber: e.target.value })}
              className={cn(
                "h-10 transition-all focus:ring-primary/20",
                storeNumberError ? "border-destructive focus-visible:ring-destructive/20" : ""
              )}
              required
            />
            {isChecking && <p className="text-[10px] text-muted-foreground animate-pulse mt-1 text-right">Tekshirilmoqda...</p>}
            {storeNumberError && (
              <div className="flex items-center gap-1 text-destructive mt-1">
                <AlertCircle className="h-3 w-3" />
                <p className="text-xs font-medium">{storeNumberError}</p>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="section" className="text-sm font-semibold">Bo'lim</Label>
            <Select
              value={formData.sectionId ? String(formData.sectionId) : undefined}
              onValueChange={(value) => setFormData({ ...formData, sectionId: Number(value) })}
              disabled={sectionsLoading}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder={sectionsLoading ? "Yuklanmoqda..." : "Bo'limni tanlang"} />
              </SelectTrigger>
              <SelectContent>
                {sections.length > 0 ? (
                  sections.map((section: any) => (
                    <SelectItem key={section.id} value={String(section.id)}>
                      {section.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground text-center">Bo'limlar mavjud emas</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="area" className="text-sm font-semibold">Yuza (kv.m)</Label>
            <Input
              id="area"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.area || ""}
              onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
              className="h-10 transition-all focus:ring-primary/20"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="text-sm font-semibold">Tavsif</Label>
            <Input
              id="description"
              placeholder="Qisqa tavsif..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
          className="flex-1 h-11 border-border/50 hover:bg-muted transition-colors"
        >
          <X className="mr-2 h-4 w-4" />
          Bekor qilish
        </Button>
        <Button
          type="submit"
          disabled={isPending || isChecking || !!storeNumberError}
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
