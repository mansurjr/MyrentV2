import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trash2, Loader2, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stall, Attendance } from "@/types/api-responses";
import { useState } from "react";

const PaymentButton = ({ attendanceId, type, label, onGetPaymentUrl, isMyRent }: any) => {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const url = await onGetPaymentUrl(attendanceId, type);
      if (url) {
        window.open(url, '_blank');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      className={cn(
        "h-8 px-3 font-medium transition-all text-xs",
        type === 'cash'
          ? "border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
          : isMyRent 
            ? "border-[#00BAFF]/30 text-[#00BAFF] hover:bg-[#00BAFF]/10 hover:text-[#00BAFF]" 
            : "border-[#00A7E1]/30 text-[#00A7E1] hover:bg-[#00A7E1]/10 hover:text-[#00A7E1]"
      )}
      onClick={handlePay}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : label}
    </Button>
  );
};

export const columns = (
  attendances: Attendance[],
  onCreate: (stallId: number, amount: number) => void,
  onDelete: (id: number) => void,
  onGetPaymentUrl: (attendanceId: number, type: string) => Promise<string>,
  isLoading: boolean,
  t: any
): ColumnDef<Stall>[] => [
  {
    accessorKey: "stallNumber",
    header: t("nav.stalls"),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-bold text-lg">{row.original.stallNumber}</span>
        <span className="text-xs text-muted-foreground">{row.original.Section?.name}</span>
      </div>
    ),
  },
  {
    accessorKey: "SaleType.name",
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
      const attendance = attendances.find(a => a.stallId === stall.id);
      
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
              : "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600"
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
      const attendance = attendances.find(a => a.stallId === stall.id);

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
              {(() => {
                const isMyRent = window.location.hostname.includes('myrent');
                const type = isMyRent ? 'payme' : 'click';
                const label = isMyRent ? 'Payme' : 'Click';
                
                return (
                  <PaymentButton 
                    attendanceId={attendance.id}
                    type={type}
                    label={label}
                    isMyRent={isMyRent}
                    onGetPaymentUrl={onGetPaymentUrl}
                  />
                );
              })()}
            </div>
          )}
          
          {attendance.status === "PAID" && (attendance as any).transaction?.fiscalQrCode && (
            <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0 hover:bg-primary/10">
              <a href={(attendance as any).transaction.fiscalQrCode} target="_blank" rel="noopener noreferrer">
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
