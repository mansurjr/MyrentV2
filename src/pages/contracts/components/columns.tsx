import type { ColumnDef } from "@tanstack/react-table";
import type { Contract } from "../../../types/api-responses";
import { MoreHorizontal, Edit, Loader2, FileText, FileX, Calendar, Smartphone, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useContracts } from "../hooks/useContracts";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { uz } from "date-fns/locale";

interface ActionCellProps {
  contract: Contract;
  onEdit: (contract: Contract) => void;
}

const ActionCell = ({ contract, onEdit }: ActionCellProps) => {
  const { updateContract } = useContracts();
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleFinish = async () => {
    try {
      await updateContract.mutateAsync({ 
        id: contract.id, 
        dto: { isActive: false } 
      });
      setIsOpen(false);
      setMenuOpen(false);
    } catch (error) {
      console.error("Error finishing contract:", error);
    }
  };

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuLabel>Amallar</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              onEdit(contract);
              setMenuOpen(false);
            }}
            className="cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
            Tahrirlash
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-orange-600 cursor-pointer focus:bg-orange-50 focus:text-orange-700"
              >
                <FileX className="mr-2 h-4 w-4" />
                Shartnomani yakunlash
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Shartnomani yakunlamoqchimisiz?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ushbu shartnoma faol bo'lmagan holatga o'tkaziladi va arxivga tushadi. Bu amal do'konni bo'shatadi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleFinish}
                  className="bg-orange-600 text-white hover:bg-orange-700"
                  disabled={updateContract.isPending}
                >
                  {updateContract.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Yakunlanmoqda...
                    </>
                  ) : (
                    "Ha, yakunlash"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const columns = (onEdit: (contract: Contract) => void): ColumnDef<Contract>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono text-muted-foreground">{row.getValue("id")}</span>,
  },
  {
    accessorKey: "certificateNumber",
    header: "Guvohnoma №",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.getValue("certificateNumber") || "—"}</span>
      </div>
    ),
  },
  {
    accessorKey: "owner.fullName",
    header: "Tadbirkor",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.owner?.fullName || "—"}
      </div>
    ),
  },
  {
    accessorKey: "store.storeNumber",
    header: "Do'kon",
    cell: ({ row }) => (
      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
        {row.original.store?.storeNumber || "—"}
      </Badge>
    ),
  },
  {
    accessorKey: "shopMonthlyFee",
    header: "Oylik to'lov",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("shopMonthlyFee") || "0");
      return (
        <div className="font-bold">
          {new Intl.NumberFormat("uz-UZ").format(amount)} UZS
        </div>
      );
    },
  },
  {
    accessorKey: "issueDate",
    header: "Berilgan sana",
    cell: ({ row }) => {
      const date = row.getValue("issueDate") as string;
      if (!date) return "—";
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {format(new Date(date), "dd.MM.yyyy", { locale: uz })}
        </div>
      );
    },
  },
  {
    id: "paymentStatus",
    header: "To'lov holati",
    cell: ({ row }) => {
      const contract = row.original;
      const isPaid = contract.isPaidCurrentMonth;
      const snapshot = contract.paymentSnapshot;
      if (!isPaid) {
        return (
          <Badge variant="destructive" className="font-semibold shadow-sm">
            Qarzdorlik
          </Badge>
        );
      }
      
      if (snapshot && snapshot.monthsAhead > 0) {
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold shadow-sm">
            {snapshot.monthsAhead} oy oldindan
          </Badge>
        );
      }
      
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold shadow-sm">
          To'langan
        </Badge>
      );
    },
  },
  {
    accessorKey: "paymentType",
    header: "To'lov turi",
    cell: ({ row }) => {
      const type = row.getValue("paymentType") as string;
      const isOnline = type === "ONLINE";
      return (
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Landmark className="h-4 w-4 text-muted-foreground" />
          )}
          <Badge variant="secondary" className="font-medium whitespace-nowrap">
            {isOnline ? "Onlayn" : "Bank orqali"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "expiryDate",
    header: "Amal qilish muddati",
    cell: ({ row }) => {
      const date = row.getValue("expiryDate") as string;
      if (!date) return "—";
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {format(new Date(date), "dd.MM.yyyy", { locale: uz })}
        </div>
      );
    },
  },

  {
    id: "actions",
    size: 150,
    cell: ({ row }) => <ActionCell contract={row.original} onEdit={onEdit} />,
  },
];
