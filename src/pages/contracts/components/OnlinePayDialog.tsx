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

interface OnlinePayDialogProps {
  contractId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMonths?: number;
  initialStartMonth?: string;
}

export function OnlinePayDialog({
  contractId,
  open,
  onOpenChange,
  initialMonths = 1,
  initialStartMonth,
}: OnlinePayDialogProps) {
  const { t } = useTranslation();
  const { getPaymentUrls } = useContracts();
  const [months, setMonths] = useState(initialMonths);
  const [startMonth, setStartMonth] = useState(initialStartMonth || "");
  const [loading, setLoading] = useState(false);

  const isMyRent = window.location.hostname.includes("myrent.uz");
  const method: 'CLICK' | 'PAYME' = isMyRent ? 'PAYME' : 'CLICK';

  const handleRedirect = async () => {
    setLoading(true);
    try {
      const params: IPaymentUrlsDto = {
        method,
      };
      if (months > 1 || (months === 1 && startMonth)) {
         params.months = months;
      }
      if (startMonth) params.startMonth = startMonth;
      
      const response = await getPaymentUrls(contractId, params);
      if (response?.url) {
        window.location.assign(response.url);
      }
    } catch (error) {
      console.error("Failed to get payment URLs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("reconciliation.confirm_payment")}</DialogTitle>
          <DialogDescription>
            {t("reconciliation.payment_intent_desc")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
          <div className="pt-4">
            <Button 
                className={cn(
                  "w-full h-16 flex flex-col items-center justify-center gap-1 border-2 transition-all group font-bold text-white",
                  isMyRent 
                    ? "bg-[#00BAFF] hover:bg-[#00BAFF]/90 border-[#00BAFF]" 
                    : "bg-[#00a3ff] hover:bg-[#00a3ff]/90 border-[#00a3ff]"
                )}
                onClick={handleRedirect}
                disabled={loading}
            >
              <span className="text-xl group-hover:scale-105 transition-transform">
                {isMyRent ? "Payme" : "CLICK"}
              </span>
              <span className="text-[10px] uppercase opacity-80">
                {isMyRent ? t("reconciliation.pay_via_payme") : t("reconciliation.pay_via_click")}
              </span>
            </Button>
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
