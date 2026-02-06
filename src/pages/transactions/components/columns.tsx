import type { ColumnDef } from "@tanstack/react-table";
import type { Transaction } from "../../../types/api-responses";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono text-muted-foreground">{row.getValue("id")}</span>,
  },
  {
    accessorKey: "transactionId",
    header: "Tranzaksiya ID",
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("transactionId") || "—"}</span>,
  },
  {
    accessorKey: "amount",
    header: "Summa",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount") as string);
      return (
        <div className="font-bold whitespace-nowrap">
          {new Intl.NumberFormat("uz-UZ").format(amount)} UZS
        </div>
      );
    },
  },
  {
    accessorKey: "paymentMethod",
    header: "To'lov turi",
    cell: ({ row }) => {
      const method = row.getValue("paymentMethod") as string;
      return (
        <Badge variant="outline" className="font-medium">
          {method === "CASH" ? "Naqd" : method}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Holati",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge 
          className={cn(
            "font-bold",
            status === "PAID" ? "bg-emerald-500 hover:bg-emerald-600" : 
            status === "PENDING" ? "bg-amber-500 hover:bg-amber-600" : "bg-destructive"
          )}
        >
          {status === "PAID" ? "To'langan" : status === "PENDING" ? "Kutilmoqda" : status}
        </Badge>
      );
    },
  },
  {
    id: "details",
    header: "Tafsilotlar",
    cell: ({ row }) => {
      const transaction = row.original;
      if (transaction.contract) {
        return (
          <div className="text-xs">
            <p className="font-medium">Do'kon: {transaction.contract.store?.storeNumber}</p>
            <p className="text-muted-foreground">{transaction.contract.owner?.fullName}</p>
          </div>
        );
      }
      if (transaction.attendance) {
        return (
          <div className="text-xs">
            <p className="font-medium">Rasta: {transaction.attendance.Stall?.stallNumber}</p>
            <p className="text-muted-foreground">Sana: {transaction.attendance.date ? format(new Date(transaction.attendance.date), "dd.MM.yyyy") : "—"}</p>
          </div>
        );
      }
      return "—";
    },
  },
  {
    accessorKey: "createdAt",
    header: "Sana",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return (
        <div className="text-xs whitespace-nowrap">
          <p className="font-medium">{format(date, "dd.MM.yyyy", { locale: uz })}</p>
          <p className="text-muted-foreground font-mono">{format(date, "HH:mm")}</p>
        </div>
      );
    },
  },
];
