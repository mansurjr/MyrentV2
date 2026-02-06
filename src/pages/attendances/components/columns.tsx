import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stall, Attendance } from "@/types/api-responses";

export const columns = (
  attendances: Attendance[],
  onToggleStatus: (stall: Stall, currentAttendance?: Attendance) => void,
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
          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
            Belgilanmagan
          </Badge>
        );
      }

      return (
        <Badge 
          variant={attendance.status === "PAID" ? "default" : "destructive"}
          className={cn(
            "font-bold px-3 py-1",
            attendance.status === "PAID" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"
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

      return (
        <div className="flex items-center gap-2">
          {!attendance || attendance.status === "UNPAID" ? (
            <Button 
              onClick={() => onToggleStatus(stall, attendance)}
              disabled={isLoading}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              To'landi
            </Button>
          ) : (
            <Button 
              onClick={() => onToggleStatus(stall, attendance)}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 h-8 px-4"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Qaytarish
            </Button>
          )}
        </div>
      );
    },
  },
];
