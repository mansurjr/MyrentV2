import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { PublicPaymentMethod } from "@/types/payment";
import { PaymentMethodSelector } from "./PaymentMethodSelector";

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableMethods: PublicPaymentMethod[];
  selectedMethod: PublicPaymentMethod | null;
  onSelect: (method: PublicPaymentMethod) => void;
  onConfirm: () => void;
  loading: boolean;
  error?: string | null;
  title?: string;
  description?: string;
  submitLabel?: string;
}

export function PaymentMethodDialog({
  open,
  onOpenChange,
  availableMethods,
  selectedMethod,
  onSelect,
  onConfirm,
  loading,
  error,
  title = "To'lov usulini tanlang",
  description = "Davom etish uchun to'lov providerini tanlang.",
  submitLabel = "To'lovga o'tish",
}: PaymentMethodDialogProps) {
  const hasMethods = availableMethods.length > 0;
  const canSubmit = hasMethods && selectedMethod !== null && !loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <PaymentMethodSelector
            availableMethods={availableMethods}
            selectedMethod={selectedMethod}
            onSelect={onSelect}
            disabled={loading}
          />
          {error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Bekor qilish
          </Button>
          <Button onClick={onConfirm} disabled={!canSubmit}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
