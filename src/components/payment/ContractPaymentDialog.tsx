import { useMemo } from "react";
import { CheckSquare, Loader2, Square } from "lucide-react";
import type { ContractPaymentPeriod } from "@/types/api-responses";
import type { PublicPaymentMethod } from "@/types/payment";
import { cn } from "@/lib/utils";
import {
  getPendingContractPeriodPrefix,
  getPendingContractPeriods,
  sumContractPeriods,
} from "@/lib/payment";
import { getMonthName } from "@/lib/time";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PaymentMethodSelector } from "./PaymentMethodSelector";

interface ContractPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingPeriods: ContractPaymentPeriod[];
  selectedPeriodCount: number;
  onSelectPeriodCount: (count: number) => void;
  availableMethods: PublicPaymentMethod[];
  selectedMethod: PublicPaymentMethod | null;
  onSelectMethod: (method: PublicPaymentMethod) => void;
  onConfirm: () => void;
  loading: boolean;
  error?: string | null;
  title?: string;
  description?: string;
  submitLabel?: string;
}

export function ContractPaymentDialog({
  open,
  onOpenChange,
  pendingPeriods,
  selectedPeriodCount,
  onSelectPeriodCount,
  availableMethods,
  selectedMethod,
  onSelectMethod,
  onConfirm,
  loading,
  error,
  title = "To'lov usuli va davrlarini tanlang",
  description = "Faqat birinchi to'lanmagan oydan boshlab ketma-ket oylar tanlanadi.",
  submitLabel = "To'lovga o'tish",
}: ContractPaymentDialogProps) {
  const normalizedPendingPeriods = useMemo(
    () => getPendingContractPeriods(pendingPeriods),
    [pendingPeriods],
  );
  const selectedPeriods = useMemo(
    () => getPendingContractPeriodPrefix(normalizedPendingPeriods, selectedPeriodCount),
    [normalizedPendingPeriods, selectedPeriodCount],
  );
  const totalAmount = useMemo(() => sumContractPeriods(selectedPeriods), [selectedPeriods]);
  const hasPendingPeriods = normalizedPendingPeriods.length > 0;
  const allSelected = hasPendingPeriods && selectedPeriods.length === normalizedPendingPeriods.length;
  const canSubmit =
    hasPendingPeriods && selectedPeriods.length > 0 && selectedMethod !== null && !loading;

  const togglePeriod = (periodId: string) => {
    const periodIndex = normalizedPendingPeriods.findIndex((period) => period.id === periodId);
    if (periodIndex < 0) {
      return;
    }

    onSelectPeriodCount(selectedPeriodCount > periodIndex ? periodIndex : periodIndex + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {hasPendingPeriods ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">To'lov davrlari</div>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      onSelectPeriodCount(allSelected ? 0 : normalizedPendingPeriods.length)
                    }
                    className="text-xs font-bold text-primary disabled:opacity-60"
                  >
                    {allSelected ? "Barchasini bekor qilish" : "Barchasini tanlash"}
                  </button>
                </div>
                <div className="grid gap-2">
                  {normalizedPendingPeriods.map((period) => {
                    const isSelected = selectedPeriods.some(
                      (selectedPeriod) => selectedPeriod.id === period.id,
                    );

                    return (
                      <button
                        key={period.id}
                        type="button"
                        disabled={loading}
                        onClick={() => togglePeriod(period.id)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60",
                          isSelected
                            ? "border-primary/30 bg-primary/5"
                            : "border-border/60 bg-background hover:border-primary/30 hover:bg-muted/30",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-5 w-5 items-center justify-center",
                            isSelected ? "text-primary" : "text-muted-foreground/50",
                          )}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1 flex items-center justify-between gap-4">
                          <span className="text-sm font-semibold">
                            {period.year}-yil, {getMonthName(period.month)}
                          </span>
                          <span className="text-sm font-bold">
                            {new Intl.NumberFormat("uz-UZ").format(Number(period.amount || 0))} UZS
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Umumiy summa
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {new Intl.NumberFormat("uz-UZ").format(totalAmount)} UZS
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              To'lanadigan oylar mavjud emas
            </div>
          )}

          <PaymentMethodSelector
            availableMethods={availableMethods}
            selectedMethod={selectedMethod}
            onSelect={onSelectMethod}
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
