import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useContracts, type IPaymentUrlsDto } from "../hooks/useContracts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveAvailablePaymentMethods } from "@/lib/payment";

interface OnlinePayDialogProps {
  contractId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMonths?: number;
  initialStartMonth?: string;
  availableMethods?: Array<"click" | "payme">;
}

export function OnlinePayDialog({
  contractId,
  open,
  onOpenChange,
  initialMonths = 1,
  initialStartMonth,
  availableMethods,
}: OnlinePayDialogProps) {
  const { t } = useTranslation();
  const { getPaymentUrls } = useContracts();
  const [months, setMonths] = useState(initialMonths);
  const [startMonth, setStartMonth] = useState(initialStartMonth || "");
  const [loading, setLoading] = useState(false);
  const resolvedMethods = resolveAvailablePaymentMethods(availableMethods);

  const handleRedirect = async (selectedMethod: 'CLICK' | 'PAYME') => {
    setLoading(true);
    try {
      const params: IPaymentUrlsDto = {
        method: selectedMethod,
      };
      if (months > 1 || (months === 1 && startMonth)) {
         params.months = months;
      }
      if (startMonth) params.startMonth = startMonth;
      
      const response = await getPaymentUrls(contractId, params);
      if (response?.url) {
        window.open(response.url, '_blank');
      }
    } catch (error) {
      console.error("Failed to get payment URLs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[425px]">
        <DialogHeader className="shrink-0 px-6 pb-4 pt-6">
          <DialogTitle>{t("reconciliation.confirm_payment")}</DialogTitle>
          <DialogDescription>
            {t("reconciliation.payment_intent_desc")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid flex-1 gap-4 overflow-y-auto px-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="months">{t("contracts.months_count")}</Label>
            <Input
              id="months"
              type="number"
              min={1}
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="startMonth">{t("contracts.start_month")}</Label>
            <Input
              id="startMonth"
              type="month"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 pt-2">
            <Button 
                className={cn(
                  "w-full h-12 border-2 transition-all group font-bold text-white bg-[#00a3ff] hover:bg-[#00a3ff]/90 border-[#00a3ff]"
                )}
                onClick={() => handleRedirect('CLICK')}
                disabled={loading}
            >
              <span className="text-base group-hover:scale-105 transition-transform text-white">
                CLICK
              </span>
            </Button>

            {resolvedMethods.includes("payme") && (
              <Button 
                  className={cn(
                    "w-full h-12 border-2 transition-all group font-bold text-white bg-[#00BAFF] hover:bg-[#00BAFF]/90 border-[#00BAFF]"
                  )}
                  onClick={() => handleRedirect('PAYME')}
                  disabled={loading}
              >
                <span className="text-base group-hover:scale-105 transition-transform text-white">
                  Payme
                </span>
              </Button>
            )}
          </div>
        </div>
        {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium bg-muted/50 py-3 rounded-lg animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("reconciliation.processing_payment")}
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
