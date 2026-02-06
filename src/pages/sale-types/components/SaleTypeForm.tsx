import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, X, Loader2 } from "lucide-react";
import { useSaleTypes } from "../hooks/useSaleTypes";
import type { SaleType } from "../../../types/api-responses";

interface SaleTypeFormProps {
  editData?: SaleType | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SaleTypeForm({ editData, onSuccess, onCancel }: SaleTypeFormProps) {
  const { createSaleType, updateSaleType } = useSaleTypes();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tax: 0,
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name,
        description: editData.description || "",
        tax: editData.tax,
      });
    } else {
      setFormData({ name: "", description: "", tax: 0 });
    }
  }, [editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editData) {
        await updateSaleType.mutateAsync({ id: editData.id, dto: formData });
      } else {
        await createSaleType.mutateAsync(formData);
      }
      setFormData({ name: "", description: "", tax: 0 });
      onSuccess();
    } catch (error) {
      console.error("Error saving sale type:", error);
    }
  };

  const isPending = createSaleType.isPending || updateSaleType.isPending;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-6 px-1 py-2">
        <div className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-sm font-semibold">Nomlanishi</Label>
            <Input
              id="name"
              placeholder="Masalan: Oziq-ovqat"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-10 transition-all focus:ring-primary/20"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tax" className="text-sm font-semibold">Kunlik to'lov (so'm)</Label>
            <Input
              id="tax"
              type="number"
              placeholder="Masalan: 15000"
              value={formData.tax}
              onChange={(e) => setFormData({ ...formData, tax: Number(e.target.value) })}
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
