import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useContracts, type IManualPayDto } from "../hooks/useContracts";
import type { Contract } from "../../../types/api-responses";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ManualPayDialogProps {
  contract: Contract;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ManualPayDialog({
  contract,
  open,
  onOpenChange,
  onSuccess,
}: ManualPayDialogProps) {
  const { t } = useTranslation();
  const { manualPayContract } = useContracts();
  
  const minMonth = contract.paymentSnapshot?.nextPeriodStart 
    ? format(new Date(contract.paymentSnapshot.nextPeriodStart), "yyyy-MM")
    : format(new Date(), "yyyy-MM");

  const [formData, setFormData] = useState<IManualPayDto>({
    months: 1,
    startMonth: minMonth,
    transferDate: format(new Date(), "yyyy-MM-dd"),
    transferNumber: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await manualPayContract.mutateAsync({
        id: contract.id,
        dto: {
          ...formData,
          months: Number(formData.months),
        },
      });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Manual payment error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("contracts.manual_pay")}</DialogTitle>
            <DialogDescription>
              {t("contracts.manual_pay_desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="transferNumber">
                {t("contracts.transfer_number")}
              </Label>
              <Input
                id="transferNumber"
                value={formData.transferNumber}
                onChange={(e) =>
                  setFormData({ ...formData, transferNumber: e.target.value })
                }
                placeholder="TRN12345678"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="months">{t("contracts.months_count")}</Label>
              <Input
                id="months"
                type="number"
                min={1}
                value={formData.months}
                onChange={(e) =>
                  setFormData({ ...formData, months: parseInt(e.target.value) })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startMonth">{t("contracts.start_month")}</Label>
              <Input
                id="startMonth"
                type="month"
                min={minMonth}
                value={formData.startMonth}
                onChange={(e) =>
                  setFormData({ ...formData, startMonth: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="transferDate">{t("contracts.transfer_date")}</Label>
              <Input
                id="transferDate"
                type="date"
                value={formData.transferDate}
                onChange={(e) =>
                  setFormData({ ...formData, transferDate: e.target.value })
                }
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={manualPayContract.isPending}>
              {manualPayContract.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                t("contracts.submit_payment")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
