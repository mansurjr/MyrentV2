import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trash2, Loader2, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stall, Attendance } from "@/types/api-responses";
import { useState } from "react";
import { usePaymentMethodState } from "@/hooks/usePaymentMethodState";
import { PaymentMethodDialog } from "@/components/payment/PaymentMethodDialog";
import type { PublicPaymentMethod } from "@/types/payment";

const PaymentButton = ({
  attendanceId,
  onGetPaymentUrl,
  availableMethods,
}: {
  attendanceId: number;
  onGetPaymentUrl: (
    attendanceId: number,
    method: PublicPaymentMethod,
  ) => Promise<string | null>;
  availableMethods?: readonly string[] | null;
}) => {
  const [open, setOpen] = useState(false);
  const {
    availableMethods: resolvedMethods,
    selectedMethod,
    setSelectedMethod,
    paymentUrlLoading,
    setPaymentUrlLoading,
    paymentError,
    setPaymentError,
  } = usePaymentMethodState(availableMethods ?? null);

  const handlePay = async () => {
    if (!selectedMethod) {
      setPaymentError("To'lov usulini tanlang");
      return;
    }

    setPaymentError(null);
    setPaymentUrlLoading(true);
    try {
      const url = await onGetPaymentUrl(attendanceId, selectedMethod);
      if (url) {
        setOpen(false);
        window.open(url, "_blank");
      }
    } finally {
      setPaymentUrlLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={paymentUrlLoading}
        className={cn(
          "h-8 px-3 font-medium transition-all text-xs",
          "border-[#00A7E1]/30 text-[#00A7E1] hover:bg-[#00A7E1]/10 hover:text-[#00A7E1]",
        )}
        onClick={() => setOpen(true)}
      >
        {paymentUrlLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "To'lash"}
      </Button>
      <PaymentMethodDialog
        open={open}
        onOpenChange={setOpen}
        availableMethods={resolvedMethods}
        selectedMethod={selectedMethod}
        onSelect={setSelectedMethod}
        onConfirm={() => {
          void handlePay();
        }}
        loading={paymentUrlLoading}
        error={paymentError}
        title="To'lov usulini tanlang"
        description="Davom etish uchun provider tanlang."
        submitLabel="To'lovga o'tish"
      />
    </>
  );
};

export const columns = (
  attendances: Attendance[],
  onCreate: (stallId: string | number, amount: number) => void,
  onDelete: (id: number) => void,
  onGetPaymentUrl: (
    attendanceId: number,
    method: PublicPaymentMethod,
  ) => Promise<string | null>,
  isLoading: boolean,
  t: any,
): ColumnDef<Stall>[] => [
  {
    accessorKey: "stallNumber",
    header: t("nav.stalls"),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-bold text-lg">{row.original.stallNumber}</span>
        <span className="text-xs text-muted-foreground">{row.original.section?.name}</span>
      </div>
    ),
  },
  {
    accessorKey: "saleType.name",
    header: t("nav.sale_types"),
  },
  {
    accessorKey: "dailyFee",
    header: "Sutkalik to'lov",
    cell: ({ row }) => (
      <span className="font-medium text-emerald-600">
        {new Intl.NumberFormat("uz-UZ").format(Number(row.original.dailyFee))} UZS
      </span>
    ),
  },
  {
    id: "status",
    header: "Holat",
    cell: ({ row }) => {
      const stall = row.original;
      const attendance = attendances.find((item) => item.stallId === stall.id);

      if (!attendance) {
        return (
          <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-border/50">
            Kiritilmagan
          </Badge>
        );
      }

      return (
        <Badge
          variant={attendance.status === "PAID" ? "default" : "destructive"}
          className={cn(
            "font-bold px-3 py-1",
            attendance.status === "PAID"
              ? "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600"
              : "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600",
          )}
        >
          {attendance.status === "PAID" ? "TO'LANGAN" : "TO'LANMAGAN"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Tezkor amal",
    cell: ({ row }) => {
      const stall = row.original;
      const attendance = attendances.find((item) => item.stallId === stall.id);

      if (!attendance) {
        return (
          <Button
            onClick={() => onCreate(stall.id, Number(stall.dailyFee) || 0)}
            disabled={isLoading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-4"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Qayd etish
          </Button>
        );
      }

      return (
        <div className="flex items-center gap-2">
          {attendance.status === "UNPAID" && (
            <div className="flex items-center gap-2 mr-2">
              <PaymentButton
                attendanceId={attendance.id}
                availableMethods={attendance.availableMethods}
                onGetPaymentUrl={onGetPaymentUrl}
              />
            </div>
          )}

          {attendance.status === "PAID" && attendance.transaction?.fiscalQrCode && (
            <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0 hover:bg-primary/10">
              <a href={attendance.transaction.fiscalQrCode} target="_blank" rel="noopener noreferrer">
                <QrCode className="h-4 w-4 text-primary" />
              </a>
            </Button>
          )}

          {attendance.status !== "PAID" && (
            <Button
              onClick={() => onDelete(attendance.id)}
              disabled={isLoading}
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
              title="O'chirish"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    },
  },
];
