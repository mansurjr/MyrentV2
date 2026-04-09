import { cn } from "@/lib/utils";
import type { PublicPaymentMethod } from "@/types/payment";
import { getPaymentMethodLabel } from "@/lib/payment";

interface PaymentMethodSelectorProps {
  availableMethods: PublicPaymentMethod[];
  selectedMethod: PublicPaymentMethod | null;
  onSelect: (method: PublicPaymentMethod) => void;
  disabled?: boolean;
}

export function PaymentMethodSelector({
  availableMethods,
  selectedMethod,
  onSelect,
  disabled = false,
}: PaymentMethodSelectorProps) {
  if (availableMethods.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        To'lov usuli mavjud emas
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {availableMethods.map((method) => {
        const isSelected = selectedMethod === method;

        return (
          <button
            key={method}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(method)}
            className={cn(
              "flex min-h-12 items-center justify-center rounded-xl border px-4 py-3 text-center transition-all",
              "disabled:cursor-not-allowed disabled:opacity-60",
              isSelected
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border/50 bg-background hover:border-primary/40 hover:bg-muted/30",
            )}
            aria-pressed={isSelected}
          >
            <span className="text-sm font-bold">{getPaymentMethodLabel(method)}</span>
          </button>
        );
      })}
    </div>
  );
}
